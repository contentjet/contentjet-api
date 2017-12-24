import {Model, Transaction, RelationMappings, QueryBuilder} from 'objection';
import _ = require('lodash');

export default class MediaTag extends Model {

  id: number;
  projectId: number;
  name: string;

  static get tableName(): string {
    return 'mediaTag';
  }

  static get relationMappings(): RelationMappings {
    return {
      project: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/Project`,
        join: {
          from: 'mediaTag.projectId',
          to: 'project.id'
        }
      },
      media: {
        relation: Model.ManyToManyRelation,
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

  static getInProject(projectId: number, trx: Transaction): QueryBuilder<MediaTag> {
    return MediaTag
      .query(trx)
      .where('projectId', projectId);
  }

  static async bulkGetOrCreate(names: string[], projectId: number, trx: Transaction): Promise<MediaTag[]> {
    const existingTags = await MediaTag
      .query(trx)
      .where('projectId', projectId)
      .whereIn('name', names);
    if (existingTags.length === names.length) return existingTags;
    const existingTagNames = existingTags.map(mediaTag => mediaTag.name);
    const tagsToCreate: {name: string, projectId: number}[] = _.difference(names, existingTagNames).map(name => {
      return {name, projectId};
    });
    const newTags = await MediaTag
      .query(trx)
      .insert(tagsToCreate)
      .returning('*');
    return existingTags.concat(newTags);
  }

}
