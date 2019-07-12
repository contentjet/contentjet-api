"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objection_1 = require("objection");
const config_1 = require("../config");
const url = require("url");
const lodash_1 = require("lodash");
class Media extends objection_1.Model {
    static get tableName() {
        return 'media';
    }
    static get relationMappings() {
        return {
            project: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: `${__dirname}/Project`,
                join: {
                    from: 'media.projectId',
                    to: 'project.id'
                }
            },
            user: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: `${__dirname}/User`,
                join: {
                    from: 'media.userId',
                    to: 'user.id'
                }
            },
            tags: {
                relation: objection_1.Model.ManyToManyRelation,
                modelClass: `${__dirname}/MediaTag`,
                join: {
                    from: 'media.id',
                    through: {
                        from: 'media_mediaTag.mediaId',
                        to: 'media_mediaTag.mediaTagId'
                    },
                    to: 'mediaTag.id'
                }
            }
        };
    }
    static get jsonSchema() {
        return {
            type: 'object',
            additionalProperties: false,
            properties: {
                id: {
                    type: 'integer'
                },
                name: {
                    type: 'string',
                    maxLength: 512
                },
                file: {
                    type: 'string',
                    maxLength: 512
                },
                thumbnail: {
                    type: 'string',
                    maxLength: 512
                },
                mimeType: {
                    type: 'string',
                    maxLength: 128
                },
                size: {
                    type: 'integer',
                    default: 0
                },
                width: {
                    type: 'integer',
                    default: 0,
                    minimum: 0
                },
                height: {
                    type: 'integer',
                    default: 0,
                    minimum: 0
                },
                description: {
                    type: 'string',
                    default: '',
                    maxLength: 64
                },
                projectId: {
                    type: 'integer'
                },
                userId: {
                    type: 'integer'
                },
                createdAt: {
                    type: 'string',
                    format: 'date-time'
                },
                modifiedAt: {
                    type: 'string',
                    format: 'date-time'
                }
            },
            required: ['name', 'file', 'mimeType', 'size', 'projectId', 'userId']
        };
    }
    static getInProject(projectId, trx) {
        return Media.query(trx)
            .eager('tags')
            .where('media.projectId', projectId);
    }
    static bulkDelete(arrayOfIds, projectId, trx) {
        return Media.query(trx)
            .whereIn('id', arrayOfIds)
            .andWhere('projectId', projectId)
            .delete();
    }
    toJSON() {
        // The file and thumbnail fields holds the storage-relative path to the file. We change
        // the output of this value by making it relative to MEDIA_URL.
        const data = super.toJSON();
        data.file = url.resolve(config_1.default.MEDIA_URL, data.file);
        if (data.thumbnail) {
            data.thumbnail = url.resolve(config_1.default.MEDIA_URL, data.thumbnail);
        }
        // If tags is present (like when eagerly fetched) only return tag names.
        const { tags } = data;
        if (tags)
            data.tags = tags.map((tag) => tag.name);
        return data;
    }
    async getTags(trx) {
        return (await this.$relatedQuery('tags', trx));
    }
    async setTags(mediaTags, trx) {
        const incomingTagIds = mediaTags.map(mediaTag => mediaTag.id);
        const existingTags = await this.getTags(trx);
        const existingTagIds = existingTags.map(mediaTag => mediaTag.id);
        const idsToUnrelate = lodash_1.difference(existingTagIds, incomingTagIds);
        const idsToRelate = lodash_1.difference(incomingTagIds, existingTagIds);
        // Unrelate any existing tags not in mediaTags
        const p1 = this.$relatedQuery('tags', trx)
            .unrelate()
            .whereIn('id', idsToUnrelate);
        // Relate incoming mediaTags
        const p2 = this.$relatedQuery('tags', trx).relate(idsToRelate);
        await Promise.all([p1, p2]);
        return mediaTags;
    }
}
exports.default = Media;
