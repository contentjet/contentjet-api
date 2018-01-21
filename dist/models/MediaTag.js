"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objection_1 = require("objection");
const _ = require("lodash");
class MediaTag extends objection_1.Model {
    static get tableName() {
        return 'mediaTag';
    }
    static get relationMappings() {
        return {
            project: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: `${__dirname}/Project`,
                join: {
                    from: 'mediaTag.projectId',
                    to: 'project.id'
                }
            },
            media: {
                relation: objection_1.Model.ManyToManyRelation,
                modelClass: `${__dirname}/Media`,
                join: {
                    from: 'mediaTag.id',
                    through: {
                        from: 'media_mediaTag.mediaTagId',
                        to: 'media_mediaTag.mediaId'
                    },
                    to: 'media.id'
                }
            }
        };
    }
    static get jsonSchema() {
        return {
            type: 'object',
            additionalProperties: false,
            properties: {
                name: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 32
                },
                projectId: {
                    type: 'integer'
                }
            },
            required: [
                'name',
                'projectId'
            ]
        };
    }
    static getInProject(projectId, trx) {
        return MediaTag
            .query(trx)
            .where('projectId', projectId);
    }
    static async bulkGetOrCreate(names, projectId, trx) {
        const existingTags = await MediaTag
            .query(trx)
            .where('projectId', projectId)
            .whereIn('name', names);
        if (existingTags.length === names.length)
            return existingTags;
        const existingTagNames = existingTags.map(mediaTag => mediaTag.name);
        const tagsToCreate = _.difference(names, existingTagNames).map(name => {
            return { name, projectId };
        });
        const newTags = await MediaTag
            .query(trx)
            .insert(tagsToCreate)
            .returning('*');
        return existingTags.concat(newTags);
    }
}
exports.default = MediaTag;
