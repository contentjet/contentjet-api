import {Model, QueryBuilder, QueryBuilderOption, QueryBuilderSingle, Transaction, RelationMappings} from 'objection';
import ProjectMembership from './ProjectMembership';
import User from './User';
import WebHook from './WebHook';

export interface IMember extends User {
  membershipType: string;
  membershipIsActive: boolean;
}

export default class Project extends Model {

  id: number;
  name: string;
  metadata: string;
  userId: number;
  createdAt: Date;
  modifiedAt: Date;

  static get tableName(): string {
    return 'project';
  }

  static get relationMappings(): RelationMappings {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/User`,
        join: {
          from: 'project.userId',
          to: 'user.id'
        }
      },
      members: {
        relation: Model.ManyToManyRelation,
        modelClass: `${__dirname}/User`,
        join: {
          from: 'project.id',
          through: {
            from: 'projectmembership.projectId',
            to: 'projectmembership.userId',
            extra: ['membershipType', 'membershipIsActive']
          },
          to: 'user.id'
        }
      },
      webHooks: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/WebHook`,
        join: {
          from: 'project.id',
          to: 'webHook.projectId'
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
          minLength: 1,
          maxLength: 64
        },
        metadata: {
          type: 'string',
          default: '',
          maxLength: 3000
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
      required: ['name', 'userId']
    };
  }

  static getById(id: number, trx?: Transaction): QueryBuilderOption<Project> {
    return Project
      .query(trx)
      .where('id', id)
      .first();
  }

  static async deleteAll(trx?: Transaction): Promise<number> {
    const num: any = await Project
      .query(trx)
      .delete();
    return num as number;
  }

  async getUsers(trx?: Transaction): Promise<IMember[]> {
    return await this.$relatedQuery<IMember>('members', trx);
  }

  getUserById(id: number, trx?: Transaction): QueryBuilderOption<User> {
    return this
      .$relatedQuery<User>('members', trx)
      .where('id', id)
      .first();
  }

  _isMember(userId: number, membershipType?: string, trx?: Transaction): QueryBuilderOption<User> {
    let query = this
      .$relatedQuery<User>('members', trx)
      .where('id', userId);
    if (membershipType) query = query.andWhere('membershipType', membershipType);
    return query.first();
  }

  isMember(userId: number, membershipType?: string, trx?: Transaction): Promise<boolean> {
    if (this.isOwner(userId)) return Promise.resolve(true);
    return this
      ._isMember(userId, membershipType, trx)
      .then(id => !!id);
  }

  isActiveMember(userId: number, membershipType?: string, trx?: Transaction): Promise<boolean> {
    if (this.isOwner(userId)) return Promise.resolve(true);
    return this
      ._isMember(userId, membershipType, trx)
      .andWhere('membershipIsActive', true)
      .then(id => !!id);
  }

  isOwner(userId: number): boolean {
    return this.userId === userId;
  }

  getUsersByMembershipType(membershipType: string, trx?: Transaction): QueryBuilder<User> {
    return this
      .$relatedQuery<User>('members', trx)
      .where('membershipType', membershipType);
  }

  async addUser(user: User, membershipType: string, trx?: Transaction): Promise<User> {
    const existingUserId = await this
      .$relatedQuery<User>('members', trx)
      .select('id')
      .where('id', user.id)
      .first();
    if (existingUserId) return user;
    await this
      .$relatedQuery<User>('members', trx)
      .relate<User & ProjectMembership>({
        id: user.id,
        membershipType: membershipType
      });
    return user;
  }

  removeUser(userId: number, trx?: Transaction): QueryBuilder<User> {
    return this
      .$relatedQuery<User>('members', trx)
      .unrelate()
      .where('id', userId);
  }

  updateUserMembership(userId: number, membershipIsActive: boolean, membershipType?: string, trx?: Transaction): QueryBuilder<number> {
    return ProjectMembership
      .query(trx)
      .patch({membershipType, membershipIsActive})
      .where({
        'userId': userId,
        'projectId': this.id
      });
  }

  delete(trx?: Transaction): QueryBuilderSingle<number> {
    return Project
      .query(trx)
      .deleteById(this.id);
  }

  getActiveWebHooks(trx?: Transaction): QueryBuilder<WebHook> {
    return this
      .$relatedQuery<WebHook>('webHooks', trx)
      .where('isActive', true);
  }

}
