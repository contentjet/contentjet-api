import * as Koa from 'koa';
import {isInteger, clone, cloneDeep} from 'lodash';
import * as moment from 'moment';
import Entry from '../models/Entry';
import EntryTag from '../models/EntryTag';
import EntryType from '../models/EntryType';
import BaseViewSet, {IPaginatedResult} from './BaseViewSet';
import ValidationError from '../errors/ValidationError';
import NotFoundError from '../errors/NotFoundError';
import DatabaseError from '../errors/DatabaseError';
import validate from '../utils/validate';
import {transaction} from 'objection';
import {requirePermission} from '../authorization/middleware';
import {requireAuthentication} from '../authentication/jwt/middleware';

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

enum EntryOrderBy {
  createdAtDesc = '-createdAt',
  createdAt = 'createdAt',
  modifiedAtDesc = '-modifiedAt',
  modifiedAt= 'modifiedAt'
}

interface IEntryListQuery {
  tags?: string;
  entryType?: string;
  nonPublished?: string;
  search?: string;
  orderBy?: EntryOrderBy
}

export default class EntryViewSet extends BaseViewSet<Entry> {

  constructor(options: any) {
    super(Entry, options);
    this.bulkDelete = this.bulkDelete.bind(this);
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

  getListQueryBuilder(ctx: Koa.Context) {
    let queryBuilder = Entry
      .getInProject(ctx.state.project.id)
      .eager('[tags, entryType, modifiedByUser, user]');
    let {tags, entryType, nonPublished, search, orderBy} = ctx.request.query as IEntryListQuery;
    // We only include entries where published date is in the past. If nonPublished
    // query parameter is present we include BOTH published and non-published entries.
    if (!nonPublished) {
      queryBuilder = queryBuilder.where('entry.published', '<', moment().toDate());
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
      if (isInteger(entryTypeId) && entryTypeId > 0) {
        queryBuilder = queryBuilder.where('entry.entryTypeId', entryTypeId);
      }
    }
    // Filter by EntryTags
    if (tags) {
      const tagsList = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      queryBuilder = queryBuilder
        .joinRelation('tags')
        .distinct('entry.*') as any;
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
      if (orderBy === EntryOrderBy.createdAt) {
        queryBuilder = queryBuilder.orderBy('entry.createdAt');
      } else if (orderBy === EntryOrderBy.createdAtDesc) {
        queryBuilder = queryBuilder.orderBy('entry.createdAt', 'desc');
      } else if (orderBy === EntryOrderBy.modifiedAt) {
        queryBuilder = queryBuilder.orderBy('entry.modifiedAt');
      } else if (orderBy === EntryOrderBy.modifiedAtDesc) {
        queryBuilder = queryBuilder.orderBy('entry.modifiedAt', 'desc');
      }
    } else {
      queryBuilder = queryBuilder.orderBy('entry.modifiedAt', 'desc');
    }
    return queryBuilder;
  }

  getRetrieveQueryBuilder(ctx: Koa.Context) {
    return Entry.getInProjectWithRelations(ctx.state.project.id);
  }

  initialValidation(entryData: object) {
    const errors = validate(entryData, initialValidationConstraints);
    if (errors) {
      const err = new ValidationError();
      err.errors = errors;
      throw err;
    }
  }

  async validateFields(entryType: EntryType, fields: any, projectId: number) {
    try {
      await entryType.validateEntryFields(fields, projectId);
    } catch (fieldErrors) {
      const err = new ValidationError();
      err.errors = {fields: fieldErrors};
      throw err;
    }
  }

  async list(ctx: Koa.Context) {
    let result = await super.list(ctx);
    let entries: Entry[];
    if ('results' in result) {
      const paginatedResult = result as IPaginatedResult;
      entries = paginatedResult.results;
    } else {
      entries = result as Entry[];
    }
    const mappedEntries = entries.map(entry => {
      const json = entry.toJSON() as any;
      // Return tags as strings, not objects
      json.tags = json.tags.map((tag: {name: string}) => tag.name);
      // Don't include entry fields and entryType fields on list endpoint
      delete json.fields;
      delete json.entryType.fields;
      return json;
    });
    if ('results' in result) {
      result = result as IPaginatedResult;
      result.results = mappedEntries;
    } else {
      result = mappedEntries;
    }
    ctx.body = result;
    ctx.state.viewsetResult.data = result;
    return result;
  }

  async create(ctx: Koa.Context) {
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
    const entryData = cloneDeep(ctx.request.body);
    delete entryData.tags;
    entryData.userId = user.id;
    entryData.modifiedByUserId = user.id;
    entryData.fields = Entry.externalFieldsToInternal(entryType.fields, fields);
    const knex = Entry.knex();
    return await transaction(knex, async (trx) => {
      // Create new entry
      const entry = await Entry
        .query(trx)
        .insert(entryData)
        .returning('*')
        .first();
      if (!entry) throw new DatabaseError();
      // Get or create tags and relate them to entry
      let entryTags = await EntryTag.bulkGetOrCreate(tags, project.id, trx);
      entryTags = await entry.setTags(entryTags, trx);
      const entryJSON = entry.toJSON() as any;
      entryJSON.tags = entryTags.map(entryTag => entryTag.name);
      entryJSON.fields = await entry.internalFieldsToExternal(entryType.fields, trx);
      ctx.body = entryJSON;
      ctx.state.viewsetResult = {
        action: 'create',
        modelClass: Entry,
        data: entryJSON
      };
      return entry;
    });
  }

  async retrieve(ctx: Koa.Context) {
    const entry = await super.retrieve(ctx) as any;
    const entryJSON = entry.toJSON() as any;
    entryJSON.tags = entry.tags.map((entryTag: {name: string}) => entryTag.name);
    entryJSON.fields = await entry.internalFieldsToExternal(entry.entryType.fields);
    delete entryJSON.entryType.fields;
    ctx.body = entryJSON;
    ctx.state.viewsetResult = {
      action: 'retrieve',
      modelClass: this.Model,
      data: entryJSON
    };
    return entry;
  }

  async update(ctx: Koa.Context) {
    this.initialValidation(ctx.request.body);
    const {fields, tags} = ctx.request.body;
    const {project, user} = ctx.state;
    const id = ctx.params[this.getIdRouteParameter()];
    const knex = Entry.knex();
    return await transaction(knex, async (trx) => {
      let entry = await Entry
        .getInProject(project.id, trx)
        .where('entry.id', id)
        .first();
      if (!entry) throw new NotFoundError();
      const entryType = await EntryType.getById(entry.entryTypeId, trx);
      if (!entryType) throw new NotFoundError('The entry\'s entry type does not exist');
      // Check the entry fields are valid against the entry type's fields
      await this.validateFields(entryType, fields, project.id);
      // Prepare the data for insertion into database
      const entryData = clone(ctx.request.body);
      delete entryData.createdAt;
      delete entryData.tags;
      delete entryData.id;
      delete entryData.entryType;
      delete entryData.user;
      delete entryData.modifiedByUser;
      entryData.modifiedAt = moment().format();
      entryData.entryTypeId = entryType.id;
      entryData.modifiedByUserId = user.id;
      entryData.fields = Entry.externalFieldsToInternal(entryType.fields, fields, entry.fields);
      // Update entry
      entry = await Entry
        .query(trx)
        .update(entryData)
        .returning('*')
        .where('id', entry.id)
        .first();
      if (!entry) throw new DatabaseError();
      // Get or create tags and relate them to entry
      let entryTags = await EntryTag.bulkGetOrCreate(tags, project.id, trx);
      entryTags = await entry.setTags(entryTags, trx);
      const entryJSON = entry.toJSON() as any;
      entryJSON.tags = entryTags.map(entryTag => entryTag.name);
      entryJSON.fields = await entry.internalFieldsToExternal(entryType.fields, trx);
      ctx.body = entryJSON;
      ctx.state.viewsetResult = {
        action: 'update',
        modelClass: this.Model,
        data: entryJSON
      };
      return entry;
    });
  }

  async bulkDelete(ctx: Koa.Context) {
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
