const Model = require('objection').Model;
const User = require('./User');
const WebHook = require('./WebHook');
const ProjectMembership = require('./ProjectMembership');

class Project extends Model {

  static get tableName() {
    return 'project';
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'project.userId',
          to: 'user.id'
        }
      },
      members: {
        relation: Model.ManyToManyRelation,
        modelClass: User,
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
        modelClass: WebHook,
        join: {
          from: 'project.id',
          to: 'webHook.projectId'
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

  static getById(id, trx) {
    return Project
      .query(trx)
      .where('id', id)
      .first();
  }

  static deleteAll(trx) {
    return Project
      .query(trx)
      .delete();
  }

  getUsers(trx) {
    return this.$relatedQuery('members', trx);
  }

  getUserById(id, trx) {
    return this
      .$relatedQuery('members', trx)
      .where('id', id)
      .first();
  }

  _isMember(user, membershipType, trx) {
    let query = this
      .$relatedQuery('members', trx)
      .where('id', user.id);
    if (membershipType) query = query.andWhere('membershipType', membershipType);
    return query.first('id');
  }

  isMember(user, membershipType, trx) {
    if (this.isOwner(user)) return Promise.resolve(true);
    return this
      ._isMember(user, membershipType, trx)
      .then(id => !!id);
  }

  isActiveMember(user, membershipType, trx) {
    if (this.isOwner(user)) return Promise.resolve(true);
    return this
      ._isMember(user, membershipType, trx)
      .andWhere('membershipIsActive', true)
      .then(id => !!id);
  }

  isOwner(user) {
    return this.userId === user.id;
  }

  getUsersByMembershipType(membershipType, trx) {
    return this
      .$relatedQuery('members', trx)
      .where('membershipType', membershipType);
  }

  async addUser(user, membershipType, trx) {
    const existingUserId = await this
      .$relatedQuery('members', trx)
      .select('id')
      .where('id', user.id)
      .first();
    if (existingUserId) return user;
    await this
      .$relatedQuery('members', trx)
      .relate({
        id: user.id,
        membershipType: membershipType
      });
    return user;
  }

  removeUser(user, trx) {
    return this
      .$relatedQuery('members', trx)
      .unrelate()
      .where('id', user.id);
  }

  updateUserMembership(userId, {membershipIsActive, membershipType}, trx) {
    return ProjectMembership
      .query(trx)
      .patch({membershipType, membershipIsActive})
      .where({
        'userId': userId,
        'projectId': this.id
      });
  }

  delete(trx) {
    return Project
      .query(trx)
      .deleteById(this.id);
  }

  getActiveWebHooks(trx) {
    return this
      .$relatedQuery('webHooks', trx)
      .where('isActive', true);
  }

}

module.exports = Project;
