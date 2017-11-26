const _ = require('lodash');
const moment = require('moment');
const Entry = require('../models/Entry');
const EntryTag = require('../models/EntryTag');
const EntryType = require('../models/EntryType');
const BaseViewSet = require('./BaseViewSet');
const ValidationError = require('../errors/ValidationError');
const NotFoundError = require('../errors/NotFoundError');
const validate = require('../utils/validate');
const transaction = require('objection').transaction;
const {requirePermission} = require('../authorization/middleware');
const {requireAuthentication} = require('../authentication/jwt/middleware');

const initialValidationConstraints = {
  entryTypeId: {
    presence: true,
    numericality: {
      presence: true,
      onlyInteger: true,
      strict: true,
      greaterThan: 0
    }
  },
  fields: {
    presence: {
      allowEmpty: true
    }
  },
  tags: {
    presence: {
      allowEmpty: true
    },
    tags: true
  }
};

class EntryViewSet extends BaseViewSet {

  constructor(options) {
    super(Entry, options);
    this.bulkDelete = this.bulkDelete.bind(this);
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

  getListQueryBuilder(ctx) {
    let queryBuilder = Entry.getInProject(ctx.state.project.id);
    let {tags, entryType, nonPublished, search} = ctx.request.query;
    // We only include entries where published date is in the past. If nonPublished
    // query parameter is present we include BOTH published and non-published entries.
    if (!nonPublished) {
      queryBuilder = queryBuilder.where('entry.published', '<', moment());
    }
    // Crude search
    if (search) {
      const words = search.split(' ').filter(w => w).map(w => w.toLowerCase());
      words.forEach(word => {
        queryBuilder = queryBuilder.where('entry.name', 'ilike', `%${word}%`);
      });
    }
    // Filter by EntryType
    if (entryType) {
      const entryTypeId = parseInt(entryType);
      if (_.isInteger(entryTypeId) && entryTypeId > 0) {
        queryBuilder = queryBuilder.where('entry.entryTypeId', entryTypeId);
      }
    }
    // Filter by EntryTags
    if (tags) {
      tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      queryBuilder = queryBuilder
        .joinRelation('tags')
        .distinct('entry.*');
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

  getRetrieveQueryBuilder(ctx) {
    return Entry.getInProject(ctx.state.project.id);
  }

  initialValidation(entryData) {
    const errors = validate(entryData, initialValidationConstraints);
    if (errors) {
      const err = new ValidationError();
      err.errors = errors;
      throw err;
    }
  }

  async validateFields(entryType, fields, projectId) {
    try {
      await entryType.validateEntryFields(fields, projectId);
    } catch (fieldErrors) {
      const err = new ValidationError();
      err.errors = {fields: fieldErrors};
      throw err;
    }
  }

  async list(ctx, next) {
    const result = await super.list(ctx, next);
    result.results = result.results.map(entry => {
      const json = entry.toJSON();
      // Return tags as strings, not objects
      json.tags = json.tags.map(tag => tag.name);
      // Don't include entry fields and entryType fields on list endpoint
      delete json.fields;
      delete json.entryType.fields;
      return json;
    });
    ctx.body = result;
    ctx.state.viewsetResult.data = result;
  }

  async create(ctx, next) {
    this.initialValidation(ctx.request.body);
    const {entryTypeId, fields, tags} = ctx.request.body;
    const entryType = await EntryType.getById(entryTypeId);
    const {project, user} = ctx.state;
    if (!entryType || entryType.projectId !== project.id) {
      throw new ValidationError('Entry type with the provided id does not exist in project');
    }
    // Check the entry fields are valid against the entry type's fields
    await this.validateFields(entryType, fields, project.id);
    // Prepare the data for insertion into database
    const entryData = _.cloneDeep(ctx.request.body);
    delete entryData.tags;
    entryData.userId = user.id;
    entryData.modifiedByUserId = user.id;
    entryData.fields = Entry.externalFieldsToInternal(entryType.fields, fields);
    const knex = Entry.knex();
    await transaction(knex, async (trx) => {
      // Create new entry
      const entry = await Entry
        .query(trx)
        .insert(entryData)
        .returning('*');
      // Get or create tags and relate them to entry
      let entryTags = await EntryTag.bulkGetOrCreate(tags, project.id, trx);
      entryTags = await entry.setTags(entryTags, trx);
      const entryJSON = entry.toJSON();
      entryJSON.tags = entryTags.map(entryTag => entryTag.name);
      entryJSON.fields = await entry.internalFieldsToExternal(entryType.fields, trx);
      ctx.body = entryJSON;
      ctx.state.viewsetResult = {
        action: 'create',
        modelClass: Entry,
        data: entryJSON
      };
    });
  }

  async retrieve(ctx, next) {
    const entry = await super.retrieve(ctx, next);
    const entryJSON = entry.toJSON();
    entryJSON.tags = entry.tags.map(entryTag => entryTag.name);
    entryJSON.fields = await entry.internalFieldsToExternal(entry.entryType.fields);
    delete entryJSON.entryType.fields;
    ctx.body = entryJSON;
    ctx.state.viewsetResult = {
      action: 'retrieve',
      modelClass: this.Model,
      data: entryJSON
    };
  }

  async update(ctx, next) {
    this.initialValidation(ctx.request.body);
    const {fields, tags} = ctx.request.body;
    const {project, user} = ctx.state;
    const id = ctx.params[this.getIdRouteParameter()];
    const knex = Entry.knex();
    await transaction(knex, async (trx) => {
      let entry = await Entry.getInProject(project.id, trx).where('entry.id', id).first();
      if (!entry) throw new NotFoundError();
      const entryType = await EntryType.getById(entry.entryTypeId, trx);
      // Check the entry fields are valid against the entry type's fields
      await this.validateFields(entryType, fields, project.id);
      // Prepare the data for insertion into database
      const entryData = _.clone(ctx.request.body);
      delete entryData.createdAt;
      delete entryData.tags;
      delete entryData.id;
      delete entryData.entryType;
      delete entryData.user;
      delete entryData.modifiedByUser;
      entryData.modifiedAt = moment().format();
      entryData.entryTypeId = entryType.id;
      entryData.modifiedByUserId = user.id;
      entryData.fields = Entry.externalFieldsToInternal(entryType.fields, fields);
      // Update entry
      entry = await Entry
        .query(trx)
        .update(entryData)
        .where('id', entry.id)
        .first()
        .returning('*');
      // Get or create tags and relate them to entry
      let entryTags = await EntryTag.bulkGetOrCreate(tags, project.id, trx);
      entryTags = await entry.setTags(entryTags, trx);
      const entryJSON = entry.toJSON();
      entryJSON.tags = entryTags.map(entryTag => entryTag.name);
      entryJSON.fields = await entry.internalFieldsToExternal(entryType.fields, trx);
      ctx.body = entryJSON;
      ctx.state.viewsetResult = {
        action: 'update',
        modelClass: this.Model,
        data: entryJSON
      };
    });
  }

  async bulkDelete(ctx, next) {
    const arrayOfIds = ctx.request.body;
    const error = validate.single(arrayOfIds, { arrayOfIds: true });
    if (error) throw new ValidationError(error[0]);
    await Entry.bulkDelete(arrayOfIds, ctx.state.project.id);
    ctx.status = 204;
    ctx.state.viewsetResult = {
      action: 'bulkDelete',
      modelClass: Entry,
      data: arrayOfIds
    };
  }

}

module.exports = EntryViewSet;
