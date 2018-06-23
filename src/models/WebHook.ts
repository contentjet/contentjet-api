import { Model, RelationMappings } from 'objection';

export default class WebHook extends Model {

  id!: number;
  projectId!: number;
  name!: string;
  isActive!: boolean;
  url!: string;
  projectUpdated!: boolean;
  projectDeleted!: boolean;
  entryTypeCreated!: boolean;
  entryTypeUpdated!: boolean;
  entryTypeDeleted!: boolean;
  entryCreated!: boolean;
  entryUpdated!: boolean;
  entryDeleted!: boolean;
  entryDeletedBulk!: boolean;
  mediaCreated!: boolean;
  mediaUpdated!: boolean;
  mediaDeleted!: boolean;
  mediaDeletedBulk!: boolean;
  createdAt!: Date;
  modifiedAt!: Date;

  static get tableName(): string {
    return 'webHook';
  }

  static get relationMappings(): RelationMappings {
    return {
      project: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/Project`,
        join: {
          from: 'webHook.projectId',
          to: 'project.id'
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
          maxLength: 64
        },
        isActive: {
          type: 'boolean',
          default: true
        },
        url: {
          type: 'string',
          format: 'uri'
        },
        projectUpdated: {
          type: 'boolean',
          default: true
        },
        projectDeleted: {
          type: 'boolean',
          default: true
        },
        entryTypeCreated: {
          type: 'boolean',
          default: true
        },
        entryTypeUpdated: {
          type: 'boolean',
          default: true
        },
        entryTypeDeleted: {
          type: 'boolean',
          default: true
        },
        entryCreated: {
          type: 'boolean',
          default: true
        },
        entryUpdated: {
          type: 'boolean',
          default: true
        },
        entryDeleted: {
          type: 'boolean',
          default: true
        },
        entryDeletedBulk: {
          type: 'boolean',
          default: true
        },
        mediaCreated: {
          type: 'boolean',
          default: true
        },
        mediaUpdated: {
          type: 'boolean',
          default: true
        },
        mediaDeleted: {
          type: 'boolean',
          default: true
        },
        mediaDeletedBulk: {
          type: 'boolean',
          default: true
        },
        projectId: {
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
        'isActive',
        'url',
        'projectUpdated',
        'projectDeleted',
        'entryTypeCreated',
        'entryTypeUpdated',
        'entryTypeDeleted',
        'entryCreated',
        'entryUpdated',
        'entryDeleted',
        'entryDeletedBulk',
        'mediaCreated',
        'mediaUpdated',
        'mediaDeleted',
        'mediaDeletedBulk',
        'projectId'
      ]
    };
  }

}
