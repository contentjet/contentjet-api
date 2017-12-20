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

  /**
   * Returns a Project instance by id
   * @param {integer} id Project id
   * @param {object} [trx] Knex transaction object
   * @return {Promise.<Project>} Project instance
   */
  static getById(id, trx) {
    return Project
      .query(trx)
      .where('id', id)
      .first();
  }

  /**
   * Deletes all projects
   * @param {object} [trx] Knex transaction object
   * @return {Promise.<integer>} The number of projects deleted
   */
  static deleteAll(trx) {
    return Project
      .query(trx)
      .delete();
  }

  /**
   * Gets all members of this project
   * @param {object} [trx] Knex transaction object
   * @return {Promise.<[User]>} List of User instances
   */
  getUsers(trx) {
    return this.$relatedQuery('members', trx);
  }

  /**
   * Gets a member (User) of this project by their id
   * @param {integer} id User id
   * @param {object} [trx] Knex transaction object
   * @return {Promise.<User>} Returns member (User) of this project by their id
   */
  getUserById(id, trx) {
    return this
      .$relatedQuery('members', trx)
      .where('id', id)
      .first();
  }

  /**
   * Check if a user is a member of this project. Note this does NOT check if the user
   * is the owner of the project.
   * @param {User} user User instance
   * @param {string} [membershipType] Constrain check to specific membership type
   * @param {object} [trx] Knex transaction object
   * @private
   * @return {Promise.<User>}
   */
  _isMember(user, membershipType, trx) {
    let query = this
      .$relatedQuery('members', trx)
      .where('id', user.id);
    if (membershipType) query = query.andWhere('membershipType', membershipType);
    return query.first('id');
  }

  /**
   * Check if a user is a member of this project OR is the project owner
   * @param {User} user User instance
   * @param {string} [membershipType] Constrain check to specific membership type
   * @param {object} [trx] Knex transaction object
   * @return {Promise.<Boolean>}
   */
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

  /**
   * Checks if user is the project owner
   * @param {User} user User instance
   * @return {Boolean}
   */
  isOwner(user) {
    return this.userId === user.id;
  }

  /**
   * Returns users of this project by their membership type
   * @param {string} membershipType Membership type
   * @param {object} [trx] Knex transaction object
   * @return {Promise.<[User]>} List of User instances
   */
  getUsersByMembershipType(membershipType, trx) {
    return this
      .$relatedQuery('members', trx)
      .where('membershipType', membershipType);
  }

  /**
   * Adds a User to this Project
   * @param {User} user User instance
   * @param {string} membershipType Membership type
   * @param {object} [trx] Knex transaction object
   * @return {Promise.<User>} The added User instance
   */
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

  /**
   * Removes a user from this project
   * @param {User} user User instance
   * @param {object} [trx] Knex transaction object
   * @return {Promise}
   */
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

  /**
   * Deletes project
   * @param {object} [trx] Knex transaction object
   * @return {Promise.<integer>} The number of projects deleted
   */
  delete(trx) {
    return Project
      .query(trx)
      .deleteById(this.id);
  }

  /**
   * Returns active WebHooks for this Project
   * @param {object} [trx] Knex transaction object
   * @return {Promise.<[WebHook]>} List of active WebHook instances
   */
  getActiveWebHooks(trx) {
    return this
      .$relatedQuery('webHooks', trx)
      .where('isActive', true);
  }

}

module.exports = Project;
