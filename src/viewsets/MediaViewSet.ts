import config from '../config';
import * as Koa from 'koa';
import Media from '../models/Media';
import MediaTag from '../models/MediaTag';
import BaseViewSet from './BaseViewSet';
import ValidationError from '../errors/ValidationError';
import DatabaseError from '../errors/DatabaseError';
import * as sharp from 'sharp';
import {isInteger, clone, get} from 'lodash';
import * as moment from 'moment';
import validate from '../utils/validate';
import {transaction} from 'objection';
import {requirePermission} from '../authorization/middleware';
import {requireAuthentication} from '../authentication/jwt/middleware';

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

enum MediaOrderBy {
  createdAtDesc = '-createdAt',
  createdAt = 'createdAt',
  modifiedAtDesc = '-modifiedAt',
  modifiedAt= 'modifiedAt'
}

interface IMediaListQuery {
  tags?: string;
  search?: string;
  orderBy?: MediaOrderBy
}

export default class MediaViewSet extends BaseViewSet<Media> {

  constructor(options: any) {
    const clonedOptions = clone(options);
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

  getPageSize(ctx: Koa.Context) {
    const pageSize = parseInt(ctx.request.query.pageSize);
    if (isInteger(pageSize) && pageSize > 0) return pageSize;
    return super.getPageSize(ctx);
  }

  getRetrieveQueryBuilder(ctx: Koa.Context) {
    return Media.getInProject(ctx.state.project.id);
  }

  getListQueryBuilder(ctx: Koa.Context) {
    let queryBuilder = Media.getInProject(ctx.state.project.id);
    const {tags, search, orderBy} = ctx.request.query as IMediaListQuery;
    // Crude search
    if (search) {
      const words = search.split(' ').filter(w => w).map(w => w.toLowerCase());
      words.forEach(word => {
        queryBuilder = queryBuilder.where('media.name', 'ilike', `%${word}%`);
      });
    }
    // Filter by MediaTags
    if (tags) {
      const tagsList = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      queryBuilder = queryBuilder
        .joinRelation<Media>('tags')
        .distinct('media.*');
      tagsList.forEach((tag, i) => {
        if (i === 0) {
          queryBuilder = queryBuilder.where('tags.name', tag);
        } else {
          queryBuilder = queryBuilder.orWhere('tags.name', tag);
        }
      });
    }
    // Ordering
    if (orderBy) {
      if (orderBy === MediaOrderBy.createdAt) {
        queryBuilder = queryBuilder.orderBy('media.createdAt');
      } else if (orderBy === MediaOrderBy.createdAtDesc) {
        queryBuilder = queryBuilder.orderBy('media.createdAt', 'desc');
      } else if (orderBy === MediaOrderBy.modifiedAt) {
        queryBuilder = queryBuilder.orderBy('media.modifiedAt');
      } else if (orderBy === MediaOrderBy.modifiedAtDesc) {
        queryBuilder = queryBuilder.orderBy('media.modifiedAt', 'desc');
      }
    } else {
      queryBuilder = queryBuilder.orderBy('media.createdAt', 'desc');
    }
    return queryBuilder;
  }

  async upload(ctx: Koa.Context) {
    const {file} = ctx.req as any;
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
      thumbnail: thumbnailPath ? this.options.storage.getRelativePath(thumbnailPath) : undefined,
      mimeType: file.mimetype,
      size: file.size,
      width: get(metadata, 'width', 0),
      height: get(metadata, 'height', 0)
    };
    const media = await Media
      .query()
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

  async update(ctx: Koa.Context) {
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
    return await transaction(knex, async (trx) => {
      const media = await Media
        .query(trx)
        .patch(data)
        .returning('*')
        .where(`${this.Model.tableName}.id`, parseInt(ctx.params[this.getIdRouteParameter()]))
        .first();
      if (!media) throw new DatabaseError();
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
      return media;
    });
  }

  async bulkDelete(ctx: Koa.Context) {
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
