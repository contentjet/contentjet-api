"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Media_1 = require("../models/Media");
const MediaTag_1 = require("../models/MediaTag");
const BaseViewSet_1 = require("./BaseViewSet");
const ValidationError_1 = require("../errors/ValidationError");
const DatabaseError_1 = require("../errors/DatabaseError");
const lodash_1 = require("lodash");
const moment = require("moment");
const validate_1 = require("../utils/validate");
const objection_1 = require("objection");
const middleware_1 = require("../authorization/middleware");
const middleware_2 = require("../authentication/jwt/middleware");
const upload_1 = require("../middleware/upload");
const thumbnailer_1 = require("../middleware/thumbnailer");
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
var MediaOrderBy;
(function (MediaOrderBy) {
    MediaOrderBy["createdAtDesc"] = "-createdAt";
    MediaOrderBy["createdAt"] = "createdAt";
    MediaOrderBy["modifiedAtDesc"] = "-modifiedAt";
    MediaOrderBy["modifiedAt"] = "modifiedAt";
})(MediaOrderBy || (MediaOrderBy = {}));
class MediaViewSet extends BaseViewSet_1.default {
    constructor(options) {
        const clonedOptions = lodash_1.clone(options);
        clonedOptions.disabledActions = clonedOptions.disabledActions || [];
        clonedOptions.disabledActions.push('create');
        super(Media_1.default, clonedOptions);
        this.upload = this.upload.bind(this);
        this.bulkDelete = this.bulkDelete.bind(this);
        this.router.post('upload', middleware_2.requireAuthentication, middleware_1.requirePermission(`${this.modelClass.tableName}:create`), upload_1.default, thumbnailer_1.default, this.upload);
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
    getRetrieveQueryBuilder(ctx) {
        return Media_1.default.getInProject(ctx.state.project.id);
    }
    getListQueryBuilder(ctx) {
        let queryBuilder = Media_1.default.getInProject(ctx.state.project.id);
        const { tags, search, orderBy } = ctx.request.query;
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
                .joinRelation('tags')
                .distinct('media.*');
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
            if (orderBy === MediaOrderBy.createdAt) {
                queryBuilder = queryBuilder.orderBy('media.createdAt');
            }
            else if (orderBy === MediaOrderBy.createdAtDesc) {
                queryBuilder = queryBuilder.orderBy('media.createdAt', 'desc');
            }
            else if (orderBy === MediaOrderBy.modifiedAt) {
                queryBuilder = queryBuilder.orderBy('media.modifiedAt');
            }
            else if (orderBy === MediaOrderBy.modifiedAtDesc) {
                queryBuilder = queryBuilder.orderBy('media.modifiedAt', 'desc');
            }
        }
        else {
            queryBuilder = queryBuilder.orderBy('media.createdAt', 'desc');
        }
        return queryBuilder;
    }
    async upload(ctx) {
        const { file } = ctx.req;
        // Write the file to storage
        const { filePath, thumbnailPath } = await this.options.storage.write(ctx.state.project.id, file);
        // Create Media record
        const data = {
            userId: ctx.state.user.id,
            projectId: ctx.state.project.id,
            name: file.originalname,
            file: filePath,
            thumbnail: thumbnailPath,
            mimeType: file.mimetype,
            size: file.size,
            width: lodash_1.get(file, 'width', 0),
            height: lodash_1.get(file, 'height', 0)
        };
        const media = await Media_1.default
            .query()
            .insert(data)
            .returning('*');
        const mediaJSON = media.toJSON();
        mediaJSON.tags = [];
        ctx.status = 201;
        ctx.body = mediaJSON;
        ctx.state.viewsetResult = {
            action: 'create',
            modelClass: Media_1.default,
            data: mediaJSON
        };
    }
    async update(ctx) {
        // Only description and tags are updatable. All other model fields are read-only.
        const errors = validate_1.default(ctx.request.body, updateConstraints);
        if (errors) {
            const err = new ValidationError_1.default();
            err.errors = errors;
            throw err;
        }
        const { tags, description } = ctx.request.body;
        const { project } = ctx.state;
        const data = {
            modifiedAt: moment().format(),
            description
        };
        const knex = Media_1.default.knex();
        return await objection_1.transaction(knex, async (trx) => {
            const media = await Media_1.default
                .query(trx)
                .patch(data)
                .returning('*')
                .where(`${this.modelClass.tableName}.id`, parseInt(ctx.params[this.getIdRouteParameter()], 10))
                .first();
            if (!media)
                throw new DatabaseError_1.default();
            let mediaTags = await MediaTag_1.default.bulkGetOrCreate(tags, project.id, trx);
            mediaTags = await media.setTags(mediaTags, trx);
            const mediaJSON = media.toJSON();
            mediaJSON.tags = mediaTags.map(mediaTag => mediaTag.name);
            ctx.body = mediaJSON;
            ctx.state.viewsetResult = {
                action: 'update',
                modelClass: this.modelClass,
                data: mediaJSON
            };
            return media;
        });
    }
    async bulkDelete(ctx) {
        const arrayOfIds = ctx.request.body;
        const error = validate_1.default.single(arrayOfIds, { arrayOfIds: true });
        if (error)
            throw new ValidationError_1.default(error[0]);
        const { project } = ctx.state;
        await Media_1.default.bulkDelete(arrayOfIds, project.id);
        ctx.status = 204;
        ctx.state.viewsetResult = {
            action: 'bulkDelete',
            modelClass: Media_1.default,
            data: arrayOfIds
        };
    }
}
exports.default = MediaViewSet;
