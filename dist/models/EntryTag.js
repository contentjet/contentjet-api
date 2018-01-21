"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objection_1 = require("objection");
const _ = require("lodash");
class EntryTag extends objection_1.Model {
    static get tableName() {
        return 'entryTag';
    }
    static get relationMappings() {
        return {
            project: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: `${__dirname}/Project`,
                join: {
                    from: 'entryTag.projectId',
                    to: 'project.id'
                }
            },
            entries: {
                relation: objection_1.Model.ManyToManyRelation,
                modelClass: `${__dirname}/Entry`,
                join: {
                    from: 'entryTag.id',
                    through: {
                        from: 'entry_entryTag.entryTagId',
                        to: 'entry_entryTag.entryId'
                    },
                    to: 'entry.id'
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
        return EntryTag
            .query(trx)
            .where('entryTag.projectId', projectId);
    }
    static async bulkGetOrCreate(names, projectId, trx) {
        const existingTags = await EntryTag
            .query(trx)
            .where('projectId', projectId)
            .whereIn('name', names);
        if (existingTags.length === names.length)
            return existingTags;
        const existingTagNames = existingTags.map(entryTag => entryTag.name);
        const tagsToCreate = _.difference(names, existingTagNames).map(name => {
            return { name, projectId };
        });
        const newTags = await EntryTag
            .query(trx)
            .insert(tagsToCreate)
            .returning('*');
        return existingTags.concat(newTags);
    }
}
exports.default = EntryTag;
