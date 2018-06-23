import { Model, Transaction, RelationMappings, QueryBuilder } from 'objection';
import _ = require('lodash');

export default class EntryTag extends Model {

  id!: number;
  projectId!: number;
  name!: string;

  static get tableName(): string {
    return 'entryTag';
  }

  static get relationMappings(): RelationMappings {
    return {
      project: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/Project`,
        join: {
          from: 'entryTag.projectId',
          to: 'project.id'
        }
      },
      entries: {
        relation: Model.ManyToManyRelation,
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

  static get jsonSchema(): object {
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

  static getInProject(projectId: number, trx?: Transaction): QueryBuilder<EntryTag> {
    return EntryTag
      .query(trx)
      .where('entryTag.projectId', projectId);
  }

  static async bulkGetOrCreate(names: string[], projectId: number, trx?: Transaction): Promise<EntryTag[]> {
    const existingTags = await EntryTag
      .query(trx)
      .where('projectId', projectId)
      .whereIn('name', names);
    if (existingTags.length === names.length) return existingTags;
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
