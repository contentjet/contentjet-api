import {Model, Transaction, RelationMappings, QueryBuilder} from 'objection';
import MediaTag from './MediaTag';
import config = require('../config');
import url = require('url');
import _ = require('lodash');

export default class Media extends Model {

  projectId: number
  userId: number
  name: string
  file: string
  thumbnail: string
  mimeType: string
  size: number
  width: number
  height: number
  description: string
  createdAt: string
  modifiedAt: string

  static get tableName(): string {
    return 'media';
  }

  static get relationMappings(): RelationMappings {
    return {
      project: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/Project`,
        join: {
          from: 'media.projectId',
          to: 'project.id'
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/User`,
        join: {
          from: 'media.userId',
          to: 'user.id'
        }
      },
      tags: {
        relation: Model.ManyToManyRelation,
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

  static get jsonSchema(): object {
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
      required: [
        'name',
        'file',
        'mimeType',
        'size',
        'projectId',
        'userId'
      ]
    };
  }

  static getInProject(projectId: number, trx?: Transaction): QueryBuilder<Media> {
    return Media
      .query(trx)
      .eager('tags')
      .where('media.projectId', projectId);
  }

  toJSON(): any {
    // The file and thumbnail fields holds the storage-relative path to the file. We change
    // the output of this value by making it relative to MEDIA_URL.
    const data: any = super.toJSON();
    data.file = url.resolve(config.MEDIA_URL, data.file);
    if (data.thumbnail) data.thumbnail = url.resolve(config.MEDIA_URL, data.thumbnail);
    // If tags is present (like when eagerly fetched) only return tag names.
    const {tags} = data;
    if (tags) data.tags = tags.map((tag: {name: string}) => tag.name);
    return data;
  }

  static bulkDelete(arrayOfIds: number[], projectId: number, trx?: Transaction): QueryBuilder<Media> {
    return Media.query(trx)
      .whereIn('id', arrayOfIds)
      .andWhere('projectId', projectId)
      .delete();
  }

  getTags(trx?: Transaction): QueryBuilder<MediaTag> {
    return this.$relatedQuery('tags', trx);
  }

  async setTags(mediaTags: MediaTag[], trx?: Transaction): Promise<MediaTag[]> {
    const incomingTagIds = mediaTags.map(mediaTag => mediaTag.id);
    const existingTags = await this.getTags(trx);
    const existingTagIds = existingTags.map(mediaTag => mediaTag.id);
    const idsToUnrelate = _.difference(existingTagIds, incomingTagIds);
    const idsToRelate = _.difference(incomingTagIds, existingTagIds);
    // Unrelate any existing tags not in mediaTags
    const p1 = this.$relatedQuery('tags', trx).unrelate().whereIn('id', idsToUnrelate);
    // Relate incoming mediaTags
    const p2 = this.$relatedQuery('tags', trx).relate(idsToRelate);
    await Promise.all([p1, p2]);
    return mediaTags;
  }

}
