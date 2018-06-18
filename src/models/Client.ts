import {Model, QueryBuilderOption, QueryBuilderDelete, Transaction, RelationMappings} from 'objection';
import * as uuid from 'uuid';

export default class Client extends Model {

  id!: number;
  projectId!: number;
  name!: string;
  clientId!: string;
  clientSecret!: string;
  createdAt!: Date;
  modifiedAt!: Date;

  static get tableName(): string {
    return 'client';
  }

  static get relationMappings(): RelationMappings {
    return {
      project: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/Project`,
        join: {
          from: 'client.projectId',
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
        projectId: {
          'type': 'integer'
        },
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 64
        },
        clientId: {
          type: 'string',
          minLength: 32,
          maxLength: 32
        },
        clientSecret: {
          type: 'string',
          minLength: 32,
          maxLength: 32
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
      required: ['name', 'clientId', 'clientSecret']
    };
  }

  $beforeInsert() {
    this.clientId = uuid.v4().replace(/-/g, '');
    this.clientSecret = uuid.v4().replace(/-/g, '');
  }

  static getById(id: number, trx?: Transaction): QueryBuilderOption<Client> {
    return Client
      .query(trx)
      .where('id', id)
      .first();
  }

  static async deleteAll(trx?: Transaction): Promise<number> {
    const num: any = await Client
      .query(trx)
      .delete();
    return num as number;
  }

  static generateRandomString(): string {
    return uuid.v4().replace(/-/g, '')
  }

  static async create(projectId: number, name: string, trx?: Transaction): Promise<Client> {
    return await Client
      .query(trx)
      .insert({
        clientId: Client.generateRandomString(),
        clientSecret: Client.generateRandomString(),
        name,
        projectId
      })
  }

  static authenticate(clientId: string, clientSecret: string): QueryBuilderOption<Client> {
    return Client
      .query()
      .where({ clientId, clientSecret })
      .first();
  }

  delete(trx?: Transaction): QueryBuilderDelete<Client> {
    return Client
      .query(trx)
      .deleteById(this.id);
  }

}
