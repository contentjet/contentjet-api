const config = require('../config');
const Media = require('../models/Media');
const MediaTag = require('../models/MediaTag');
const BaseViewSet = require('./BaseViewSet');
const ValidationError = require('../errors/ValidationError');
const sharp = require('sharp');
const _ = require('lodash');
const moment = require('moment');
const validate = require('../utils/validate');
const transaction = require('objection').transaction;
const {requirePermission} = require('../authorization/middleware');
const {requireAuthentication} = require('../authentication/jwt/middleware');

const updateConstraints = {
  description: {
    length: {
      minimum: 0
    }
  },
  tags: {
    tags: true
  }
};

class MediaViewSet extends BaseViewSet {

  constructor(options) {
    const clonedOptions = _.clone(options);
    clonedOptions.disabledActions = clonedOptions.disabledActions || [];
    clonedOptions.disabledActions.push('create');
    super(Media, clonedOptions);
    this.upload = this.upload.bind(this);
    this.bulkDelete = this.bulkDelete.bind(this);
    this.router.post('upload', requirePermission(`${this.Model.tableName}:create`), this.options.storage.middleware, this.upload);
    this.router.post('bulk-delete', requirePermission(`${this.Model.tableName}:delete`), this.bulkDelete);
  }

  getCommonMiddleware() {
    return [requireAuthentication];
  }

  getPageSize(ctx) {
    const pageSize = parseInt(ctx.request.query.pageSize);
    if (_.isInteger(pageSize) && pageSize > 0) return pageSize;
    return super.getPageSize(ctx);
  }

  getRetrieveQueryBuilder(ctx) {
    return Media.getInProject(ctx.state.project.id);
  }

  getListQueryBuilder(ctx) {
    let queryBuilder = Media.getInProject(ctx.state.project.id);
    let {tags, search} = ctx.request.query;
    // Crude search
    if (search) {
      const words = search.split(' ').filter(w => w).map(w => w.toLowerCase());
      words.forEach(word => {
        queryBuilder = queryBuilder.where('media.name', 'ilike', `%${word}%`);
      });
    }
    // Filter by MediaTags
    if (tags) {
      tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      queryBuilder = queryBuilder
        .joinRelation('tags')
        .distinct('media.*');
      tags.forEach((tag, i) => {
        if (i === 0) {
          queryBuilder = queryBuilder.where('tags.name', tag);
        } else {
          queryBuilder = queryBuilder.orWhere('tags.name', tag);
        }
      });
    }
    return queryBuilder;
  }

  async upload(ctx, next) {
    const {file} = ctx.req;
    let metadata;
    let thumbnailPath;
    if (['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype)) {
      // Get the dimensions of uploaded image
      metadata = await sharp(file.path).metadata();
      // Create thumbnail
      const {width, height} = config.THUMBNAIL;
      if (width > 0 && height > 0) {
        thumbnailPath = file.path
          .replace(/(\w+)(\.\w+)$/, '$1-thumb$2');
        await sharp(file.path)
          .resize(width, height)
          .max()
          .toFile(thumbnailPath);
      }
    }
    // Create Media record
    const data = {
      userId: ctx.state.user.id,
      projectId: ctx.state.project.id,
      name: file.originalname,
      file: this.options.storage.getRelativePath(file.path),
      thumbnail: thumbnailPath ? this.options.storage.getRelativePath(thumbnailPath) : null,
      mimeType: file.mimetype,
      size: file.size,
      width: _.get(metadata, 'width', 0),
      height: _.get(metadata, 'height', 0)
    };
    const media = await Media.query()
      .insert(data)
      .returning('*');
    const mediaJSON = media.toJSON();
    mediaJSON.tags = [];
    ctx.status = 201;
    ctx.body = mediaJSON;
    ctx.state.viewsetResult = {
      action: 'create',
      modelClass: Media,
      data: mediaJSON
    };
  }

  async update(ctx, next) {
    // Only description and tags are updatable. All other model fields are read-only.
    const errors = validate(ctx.request.body, updateConstraints);
    if (errors) {
      const err = new ValidationError();
      err.errors = errors;
      throw err;
    }
    const {tags, description} = ctx.request.body;
    const {project} = ctx.state;
    const data = {
      modifiedAt: moment().format(),
      description: description
    };
    const knex = Media.knex();
    await transaction(knex, async (trx) => {
      const media = await Media
        .query(trx)
        .patch(data)
        .where(`${this.Model.tableName}.id`, parseInt(ctx.params[this.getIdRouteParameter()]))
        .first()
        .returning('*');
      let mediaTags = await MediaTag.bulkGetOrCreate(tags, project.id, trx);
      mediaTags = await media.setTags(mediaTags, trx);
      const mediaJSON = media.toJSON();
      mediaJSON.tags = mediaTags.map(mediaTag => mediaTag.name);
      ctx.body = mediaJSON;
      ctx.state.viewsetResult = {
        action: 'update',
        modelClass: this.Model,
        data: mediaJSON
      };
    });
  }

  async bulkDelete(ctx, next) {
    const arrayOfIds = ctx.request.body;
    const error = validate.single(arrayOfIds, { arrayOfIds: true });
    if (error) throw new ValidationError(error[0]);
    const {project} = ctx.state;
    await Media.bulkDelete(arrayOfIds, project.id);
    ctx.status = 204;
    ctx.state.viewsetResult = {
      action: 'bulkDelete',
      modelClass: Media,
      data: arrayOfIds
    };
  }

}

module.exports = MediaViewSet;
