"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const moment = require("moment");
const Entry_1 = require("../models/Entry");
const EntryTag_1 = require("../models/EntryTag");
const EntryType_1 = require("../models/EntryType");
const BaseViewSet_1 = require("./BaseViewSet");
const ValidationError_1 = require("../errors/ValidationError");
const NotFoundError_1 = require("../errors/NotFoundError");
const DatabaseError_1 = require("../errors/DatabaseError");
const validate_1 = require("../utils/validate");
const objection_1 = require("objection");
const middleware_1 = require("../authorization/middleware");
const middleware_2 = require("../authentication/jwt/middleware");
const initialValidationConstraints = {
    name: {
        presence: {
            allowEmpty: false
        }
    },
    published: {
        datetime: true,
        presence: true
    },
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
var EntryOrderBy;
(function (EntryOrderBy) {
    EntryOrderBy["createdAtDesc"] = "-createdAt";
    EntryOrderBy["createdAt"] = "createdAt";
    EntryOrderBy["modifiedAtDesc"] = "-modifiedAt";
    EntryOrderBy["modifiedAt"] = "modifiedAt";
})(EntryOrderBy || (EntryOrderBy = {}));
class EntryViewSet extends BaseViewSet_1.default {
    constructor(options) {
        super(Entry_1.default, options);
        this.bulkDelete = this.bulkDelete.bind(this);
        this.router.post('bulk-delete', middleware_2.requireAuthentication, middleware_1.requirePermission(`${this.modelClass.tableName}:delete`), this.bulkDelete);
    }
    getCommonMiddleware() {
        return [middleware_2.requireAuthentication];
    }
    getPageSize(ctx) {
        const pageSize = parseInt(ctx.request.query.pageSize, 10);
        if (lodash_1.isInteger(pageSize) && pageSize > 0)
            return pageSize;
        return super.getPageSize(ctx);
    }
    getListQueryBuilder(ctx) {
        let queryBuilder = Entry_1.default
            .getInProject(ctx.state.project.id)
            .eager('[tags, entryType, modifiedByUser, user]');
        const { tags, entryType, nonPublished, search, orderBy } = ctx.request.query;
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
            const entryTypeId = parseInt(entryType, 10);
            if (lodash_1.isInteger(entryTypeId) && entryTypeId > 0) {
                queryBuilder = queryBuilder.where('entry.entryTypeId', entryTypeId);
            }
        }
        // Filter by EntryTags
        if (tags) {
            const tagsList = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            queryBuilder = queryBuilder
                .joinRelation('tags')
                .distinct('entry.*');
            tagsList.forEach((tag, i) => {
                if (i === 0) {
                    queryBuilder = queryBuilder.where('tags.name', tag);
                }
                else {
                    queryBuilder = queryBuilder.orWhere('tags.name', tag);
                }
            });
        }
        // Ordering
        if (orderBy) {
            if (orderBy === EntryOrderBy.createdAt) {
                queryBuilder = queryBuilder.orderBy('entry.createdAt');
            }
            else if (orderBy === EntryOrderBy.createdAtDesc) {
                queryBuilder = queryBuilder.orderBy('entry.createdAt', 'desc');
            }
            else if (orderBy === EntryOrderBy.modifiedAt) {
                queryBuilder = queryBuilder.orderBy('entry.modifiedAt');
            }
            else if (orderBy === EntryOrderBy.modifiedAtDesc) {
                queryBuilder = queryBuilder.orderBy('entry.modifiedAt', 'desc');
            }
        }
        else {
            queryBuilder = queryBuilder.orderBy('entry.modifiedAt', 'desc');
        }
        return queryBuilder;
    }
    getRetrieveQueryBuilder(ctx) {
        return Entry_1.default.getInProjectWithRelations(ctx.state.project.id);
    }
    initialValidation(entryData) {
        const errors = validate_1.default(entryData, initialValidationConstraints);
        if (errors) {
            const err = new ValidationError_1.default();
            err.errors = errors;
            throw err;
        }
    }
    async validateFields(entryType, fields, projectId) {
        try {
            await entryType.validateEntryFields(fields, projectId);
        }
        catch (fieldErrors) {
            const err = new ValidationError_1.default();
            err.errors = { fields: fieldErrors };
            throw err;
        }
    }
    async list(ctx) {
        let result = await super.list(ctx);
        let entries;
        if ('results' in result) {
            const paginatedResult = result;
            entries = paginatedResult.results;
        }
        else {
            entries = result;
        }
        const mappedEntries = entries.map(entry => {
            const json = entry.toJSON();
            // Return tags as strings, not objects
            json.tags = json.tags.map((tag) => tag.name);
            // Don't include entry fields and entryType fields on list endpoint
            delete json.fields;
            delete json.entryType.fields;
            return json;
        });
        if ('results' in result) {
            result = result;
            result.results = mappedEntries;
        }
        else {
            result = mappedEntries;
        }
        ctx.body = result;
        ctx.state.viewsetResult.data = result;
        return result;
    }
    async create(ctx) {
        this.initialValidation(ctx.request.body);
        const { entryTypeId, fields, tags } = ctx.request.body;
        const entryType = await EntryType_1.default.getById(entryTypeId);
        const { project, user } = ctx.state;
        if (!entryType || entryType.projectId !== project.id) {
            throw new ValidationError_1.default('Entry type with the provided id does not exist in project');
        }
        // Check the entry fields are valid against the entry type's fields
        await this.validateFields(entryType, fields, project.id);
        // Prepare the data for insertion into database
        const entryData = lodash_1.cloneDeep(ctx.request.body);
        delete entryData.tags;
        entryData.userId = user.id;
        entryData.modifiedByUserId = user.id;
        entryData.fields = Entry_1.default.externalFieldsToInternal(entryType.fields, fields);
        const knex = Entry_1.default.knex();
        return await objection_1.transaction(knex, async (trx) => {
            // Create new entry
            const entry = await Entry_1.default
                .query(trx)
                .insert(entryData)
                .returning('*')
                .first();
            if (!entry)
                throw new DatabaseError_1.default();
            // Get or create tags and relate them to entry
            let entryTags = await EntryTag_1.default.bulkGetOrCreate(tags, project.id, trx);
            entryTags = await entry.setTags(entryTags, trx);
            const entryJSON = entry.toJSON();
            entryJSON.tags = entryTags.map(entryTag => entryTag.name);
            entryJSON.fields = await entry.internalFieldsToExternal(entryType.fields, trx);
            ctx.body = entryJSON;
            ctx.state.viewsetResult = {
                action: 'create',
                modelClass: Entry_1.default,
                data: entryJSON
            };
            return entry;
        });
    }
    async retrieve(ctx) {
        const entry = await super.retrieve(ctx);
        const entryJSON = entry.toJSON();
        entryJSON.tags = entry.tags.map((entryTag) => entryTag.name);
        entryJSON.fields = await entry.internalFieldsToExternal(entry.entryType.fields);
        delete entryJSON.entryType.fields;
        ctx.body = entryJSON;
        ctx.state.viewsetResult = {
            action: 'retrieve',
            modelClass: this.modelClass,
            data: entryJSON
        };
        return entry;
    }
    async update(ctx) {
        this.initialValidation(ctx.request.body);
        const { fields, tags } = ctx.request.body;
        const { project, user } = ctx.state;
        const id = ctx.params[this.getIdRouteParameter()];
        const knex = Entry_1.default.knex();
        return await objection_1.transaction(knex, async (trx) => {
            let entry = await Entry_1.default
                .getInProject(project.id, trx)
                .where('entry.id', id)
                .first();
            if (!entry)
                throw new NotFoundError_1.default();
            const entryType = await EntryType_1.default.getById(entry.entryTypeId, trx);
            if (!entryType)
                throw new NotFoundError_1.default('The entry\'s entry type does not exist');
            // Check the entry fields are valid against the entry type's fields
            await this.validateFields(entryType, fields, project.id);
            // Prepare the data for insertion into database
            const entryData = lodash_1.clone(ctx.request.body);
            delete entryData.createdAt;
            delete entryData.tags;
            delete entryData.id;
            delete entryData.entryType;
            delete entryData.user;
            delete entryData.modifiedByUser;
            entryData.modifiedAt = moment().format();
            entryData.entryTypeId = entryType.id;
            entryData.modifiedByUserId = user.id;
            entryData.fields = Entry_1.default.externalFieldsToInternal(entryType.fields, fields, entry.fields);
            // Update entry
            entry = await Entry_1.default
                .query(trx)
                .update(entryData)
                .returning('*')
                .where('id', entry.id)
                .first();
            if (!entry)
                throw new DatabaseError_1.default();
            // Get or create tags and relate them to entry
            let entryTags = await EntryTag_1.default.bulkGetOrCreate(tags, project.id, trx);
            entryTags = await entry.setTags(entryTags, trx);
            const entryJSON = entry.toJSON();
            entryJSON.tags = entryTags.map(entryTag => entryTag.name);
            entryJSON.fields = await entry.internalFieldsToExternal(entryType.fields, trx);
            ctx.body = entryJSON;
            ctx.state.viewsetResult = {
                action: 'update',
                modelClass: this.modelClass,
                data: entryJSON
            };
            return entry;
        });
    }
    async bulkDelete(ctx) {
        const arrayOfIds = ctx.request.body;
        const error = validate_1.default.single(arrayOfIds, { arrayOfIds: true });
        if (error)
            throw new ValidationError_1.default(error[0]);
        await Entry_1.default.bulkDelete(arrayOfIds, ctx.state.project.id);
        ctx.status = 204;
        ctx.state.viewsetResult = {
            action: 'bulkDelete',
            modelClass: Entry_1.default,
            data: arrayOfIds
        };
    }
}
exports.default = EntryViewSet;
