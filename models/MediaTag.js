const Model = require('objection').Model;
const _ = require('lodash');

class MediaTag extends Model {

  static get tableName() {
    return 'mediaTag';
  }

  static get relationMappings() {
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
    if (existingTags.length === names.length) return existingTags;
    const existingTagNames = existingTags.map(entryTag => entryTag.name);
    const tagsToCreate = _.difference(names, existingTagNames).map(name => {
      return {name, projectId};
    });
    const newTags = await MediaTag
      .query(trx)
      .insert(tagsToCreate)
      .returning('*');
    return existingTags.concat(newTags);
  }

}

module.exports = MediaTag;
