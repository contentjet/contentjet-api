const moment = require('moment');
const _ = require('lodash');
const Model = require('objection').Model;
const Media = require('./Media');

class Entry extends Model {

  static get tableName() {
    return 'entry';
  }

  static get relationMappings() {
    return {
      entryType: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/EntryType`,
        join: {
          from: 'entry.entryTypeId',
          to: 'entryType.id'
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/User`,
        join: {
          from: 'entry.userId',
          to: 'user.id'
        }
      },
      modifiedByUser: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/User`,
        join: {
          from: 'entry.modifiedByUserId',
          to: 'user.id'
        }
      },
      tags: {
        relation: Model.ManyToManyRelation,
        modelClass: `${__dirname}/EntryTag`,
        join: {
          from: 'entry.id',
          through: {
            from: 'entry_entryTag.entryId',
            to: 'entry_entryTag.entryTagId'
          },
          to: 'entryTag.id'
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
        entryTypeId: {
          type: 'integer'
        },
        userId: {
          type: 'integer'
        },
        modifiedByUserId: {
          type: 'integer'
        },
        name: {
          type: 'string',
          maxLength: 128
        },
        published: {
          type: 'string',
          format: 'date-time'
        },
        fields: {
          type: 'array'
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
      required: [
        'entryTypeId',
        'userId',
        'modifiedByUserId',
        'name',
        'published',
        'fields'
      ]
    };
  }

  static getInProject(projectId, trx) {
    return Entry
      .query(trx)
      .eager('[user, modifiedByUser, tags, entryType]')
      .joinRelation('entryType')
      .where('entryType.projectId', projectId)
      .orderBy('entry.modifiedAt', 'desc');
  }

  static bulkDelete(arrayOfIds, projectId, trx) {
    return Entry.query(trx)
      .join('entryType', 'entry.entryTypeId', 'entryType.id')
      .join('project', 'project.id', 'entryType.projectId')
      .whereIn('entry.id', arrayOfIds)
      .andWhere('project.id', projectId)
      .delete();
  }

  static externalFieldsToInternal(entryTypeFields, entryFields) {
    return entryTypeFields
      .filter(entryTypeField => !entryTypeField.disabled)
      .map(entryTypeField => {
        const {name, fieldType} = entryTypeField;
        const obj = {name, fieldType};
        if (fieldType === 'TEXT' || fieldType === 'LONGTEXT') {
          obj.value = _.get(entryFields, entryTypeField.name, '');
        } else if (fieldType === 'BOOLEAN') {
          obj.value = !!_.get(entryFields, entryTypeField.name, null);
        } else if (fieldType === 'NUMBER') {
          obj.value = _.get(entryFields, entryTypeField.name, null);
        } else if (fieldType === 'DATE') {
          const date = _.get(entryFields, entryTypeField.name, null);
          obj.value = date ? moment.utc(date).format() : null;
        } else if (fieldType === 'CHOICE') {
          obj.value = _.get(entryFields, entryTypeField.name, []);
        } else if (fieldType === 'COLOR') {
          obj.value = _.get(entryFields, entryTypeField.name, '');
        } else if (fieldType === 'MEDIA') {
          obj.value = _.get(entryFields, entryTypeField.name, []).map(media => media.id);
        } else if (fieldType === 'LINK') {
          obj.value = _.get(entryFields, entryTypeField.name, []).map(entry => entry.id);
        } else if (fieldType === 'LIST') {
          obj.value = _.get(entryFields, entryTypeField.name, []);
        }
        return obj;
      });
  }

  getFieldValue(fieldName, fieldType) {
    const field = this.fields.find(
      field => field.name === fieldName && field.fieldType === fieldType
    );
    return _.get(field, 'value');
  }

  async internalFieldsToExternal(entryTypeFields, trx) {
    const obj = {};
    for (const entryTypeField of entryTypeFields) {
      let value = this.getFieldValue(entryTypeField.name, entryTypeField.fieldType);
      if (_.isArray(value)) {
        // Note for MEDIA and LINK types we order the query results to match
        // the order of the ids stored in the field's value.
        if (entryTypeField.fieldType === 'MEDIA') {
          const mediaResult = await Media.query(trx).whereIn('id', value);
          const orderedMedia = [];
          value.forEach(id => {
            const media = mediaResult.find(m => m.id === id);
            if (media) orderedMedia.push(media);
          });
          value = orderedMedia;
        } else if (entryTypeField.fieldType === 'LINK') {
          const entryResult = await Entry.query(trx).whereIn('id', value);
          const orderedEntries = [];
          value.forEach(id => {
            const entry = entryResult.find(e => e.id === id);
            if (entry) orderedEntries.push(entry);
          });
          value = orderedEntries;
        }
      }
      obj[entryTypeField.name] = value || null;
    }
    return obj;
  }

  async getTags(trx) {
    return this.$relatedQuery('tags', trx);
  }

  async setTags(entryTags, trx) {
    const incomingTagIds = entryTags.map(entryTag => entryTag.id);
    const existingTags = await this.getTags(trx);
    const existingTagIds = existingTags.map(entryTag => entryTag.id);
    const idsToUnrelate = _.difference(existingTagIds, incomingTagIds);
    const idsToRelate = _.difference(incomingTagIds, existingTagIds);
    // Unrelate any existing tags not in entryTags
    const p1 = this.$relatedQuery('tags', trx).unrelate().whereIn('id', idsToUnrelate);
    // Relate incoming entryTags
    const p2 = this.$relatedQuery('tags', trx).relate(idsToRelate);
    await Promise.all([p1, p2]);
    return entryTags;
  }

}

module.exports = Entry;
