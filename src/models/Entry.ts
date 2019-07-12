import * as moment from 'moment';
import { get, isArray, difference, pick } from 'lodash';
import { Model, Transaction, QueryBuilder, RelationMappings } from 'objection';
import Media from './Media';
import EntryTag from './EntryTag';
import EntryType from './EntryType';
import User from './EntryType';
import { IEntryTypeField } from './EntryType';

export interface IEntryField {
  name: string;
  fieldType: string;
  value: any;
}

export interface IExternalEntryFields {
  [name: string]: any;
}

interface IObjectWithId {
  id: number;
}

interface IInternalField {
  name: string;
  fieldType: string;
  value: any;
}

export interface IEntryWithRelations extends Entry {
  user: User;
  modifiedByUser: User;
  tags: EntryTag[];
  entryType: EntryType;
}

export default class Entry extends Model {
  id!: number;
  entryTypeId!: number;
  userId!: number;
  modifiedByUserId!: number;
  name!: string;
  published!: Date | string;
  fields!: IEntryField[];
  createdAt!: Date;
  modifiedAt!: Date;

  user?: User;
  modifiedByUser?: User;
  tags?: EntryTag[];
  entryType?: EntryType;

  static get tableName(): string {
    return 'entry';
  }

  static get relationMappings(): RelationMappings {
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

  static get jsonSchema(): any {
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

  static async create(data: any, trx?: Transaction): Promise<Entry> {
    const fieldNames = Object.keys(Entry.jsonSchema.properties);
    return Entry.query(trx)
      .insert(pick(data, fieldNames))
      .returning('*')
      .first() as any;
  }

  static getInProject(
    projectId: number,
    trx?: Transaction
  ): QueryBuilder<Entry> {
    return Entry.query(trx)
      .joinRelation<Entry>('entryType')
      .where('entryType.projectId', projectId);
  }

  static getInProjectWithRelations(
    projectId: number,
    trx?: Transaction
  ): QueryBuilder<Entry> {
    return Entry.getInProject(projectId, trx).eager(
      '[user, modifiedByUser, tags, entryType]'
    ) as any;
  }

  static async bulkDelete(
    arrayOfIds: number[],
    projectId: number,
    trx?: Transaction
  ): Promise<number> {
    const entries = await Entry.query(trx)
      .join('entryType', 'entry.entryTypeId', 'entryType.id')
      .join('project', 'project.id', 'entryType.projectId')
      .whereIn('entry.id', arrayOfIds)
      .andWhere('project.id', projectId);
    const entryIds = entries.map(entry => entry.id);
    const numDeleted = await Entry.query(trx)
      .whereIn('entry.id', entryIds)
      .delete();
    return numDeleted;
  }

  static externalFieldsToInternal(
    entryTypeFields: IEntryTypeField[],
    entryFields: IExternalEntryFields,
    existingFields?: IInternalField[]
  ): IInternalField[] {
    return entryTypeFields.map(entryTypeField => {
      const { name, fieldType, disabled } = entryTypeField;
      if (disabled && existingFields) {
        const existingField = existingFields.find(f => f.name === name);
        if (existingField) return existingField;
      }
      const obj: IInternalField = { name, fieldType, value: null };
      if (fieldType === 'TEXT' || fieldType === 'LONGTEXT') {
        obj.value = get(entryFields, entryTypeField.name, '');
      } else if (fieldType === 'BOOLEAN') {
        obj.value = !!get(entryFields, entryTypeField.name, null);
      } else if (fieldType === 'NUMBER') {
        obj.value = get(entryFields, entryTypeField.name, null);
      } else if (fieldType === 'DATE') {
        const date = get(entryFields, entryTypeField.name, null);
        obj.value = date ? moment.utc(date).format() : null;
      } else if (fieldType === 'CHOICE') {
        obj.value = get(entryFields, entryTypeField.name, []) || [];
      } else if (fieldType === 'COLOR') {
        obj.value = get(entryFields, entryTypeField.name, '');
      } else if (fieldType === 'MEDIA') {
        const media: IObjectWithId[] =
          get(entryFields, entryTypeField.name, []) || [];
        obj.value = media.map(m => m.id);
      } else if (fieldType === 'LINK') {
        const entires: IObjectWithId[] =
          get(entryFields, entryTypeField.name, []) || [];
        obj.value = entires.map(entry => entry.id);
      } else if (fieldType === 'LIST') {
        obj.value = get(entryFields, entryTypeField.name, []) || [];
      }
      return obj;
    });
  }

  static async deleteAll(trx?: Transaction): Promise<number> {
    const num: any = await Entry.query(trx).delete();
    return num as number;
  }

  getFieldValue(fieldName: string, fieldType: string): any {
    const field = this.fields.find(
      f => f.name === fieldName && f.fieldType === fieldType
    );
    return get(field, 'value');
  }

  async internalFieldsToExternal(
    entryTypeFields: IEntryTypeField[],
    trx?: Transaction
  ): Promise<IExternalEntryFields> {
    const obj: IExternalEntryFields = {};
    for (const entryTypeField of entryTypeFields) {
      if (entryTypeField.disabled) continue;
      let value = this.getFieldValue(
        entryTypeField.name,
        entryTypeField.fieldType
      );
      if (isArray(value)) {
        // Note for MEDIA and LINK types we order the query results to match
        // the order of the ids stored in the field's value.
        if (entryTypeField.fieldType === 'MEDIA') {
          const mediaResult = await Media.query(trx).whereIn('id', value);
          const orderedMedia: Media[] = [];
          value.forEach(id => {
            const media = mediaResult.find(m => m.id === id);
            if (media) orderedMedia.push(media);
          });
          value = orderedMedia;
        } else if (entryTypeField.fieldType === 'LINK') {
          const entryResult = await Entry.query(trx)
            .select('id', 'name', 'entryTypeId')
            .whereIn('id', value);
          const orderedEntries: Entry[] = [];
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

  async getTags(trx?: Transaction): Promise<EntryTag[]> {
    return (await this.$relatedQuery('tags', trx)) as EntryTag[];
  }

  async setTags(entryTags: EntryTag[], trx?: Transaction): Promise<EntryTag[]> {
    const incomingTagIds = entryTags.map(entryTag => entryTag.id);
    const existingTags = await this.getTags(trx);
    const existingTagIds = existingTags.map(entryTag => entryTag.id);
    const idsToUnrelate = difference(existingTagIds, incomingTagIds);
    const idsToRelate = difference(incomingTagIds, existingTagIds);
    // Unrelate any existing tags not in entryTags
    const p1 = this.$relatedQuery('tags', trx)
      .unrelate()
      .whereIn('id', idsToUnrelate);
    // Relate incoming entryTags
    const p2 = this.$relatedQuery('tags', trx).relate(idsToRelate);
    await Promise.all([p1, p2]);
    return entryTags;
  }
}
