const Model = require('objection').Model;
const jwt = require('jsonwebtoken');
const config = require('../config');
const Project = require('./Project');
const User = require('./User');

class ProjectInvite extends Model {

  static get tableName() {
    return 'projectInvite';
  }

  static get relationMappings() {
    return {
      project: {
        relation: Model.BelongsToOneRelation,
        modelClass: Project,
        join: {
          from: 'projectInvite.projectId',
          to: 'project.id'
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'projectInvite.userId',
          to: 'user.id'
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
          maxLength: 128
        },
        email: {
          type: 'string',
          format: 'email'
        },
        accepted: {
          type: 'boolean',
          default: false
        },
        userId: {
          type: 'integer'
        },
        projectId: {
          type: 'integer'
        }
      },
      required: [
        'name',
        'email',
        'userId',
        'projectId'
      ]
    };
  }

  static generateInviteToken(projectInviteId, projectName, projectId) {
    return new Promise((resolve, reject) => {
      jwt.sign(
        {projectInviteId, projectName, projectId},
        `invite${config.SECRET_KEY}`,
        {expiresIn: '7 days'},
        function (err, token) {
          if (err) {
            reject(err);
          } else {
            resolve(token);
          }
        }
      );
    });
  }

  static verifyInviteToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        `invite${config.SECRET_KEY}`,
        function (err, payload) {
          if (err) {
            reject(err);
          } else {
            resolve(payload);
          }
        }
      );
    });
  }

  static bulkDelete(arrayOfIds, projectId, trx) {
    return ProjectInvite
      .query(trx)
      .whereIn('id', arrayOfIds)
      .andWhere('projectId', projectId)
      .delete();
  }

  static accept(id, trx) {
    return ProjectInvite
      .query(trx)
      .patch({accepted: true})
      .where({
        'id': id,
        'accepted': false
      });
  }

}

module.exports = ProjectInvite;
