import {Model, RelationMappings, QueryBuilder, Transaction} from 'objection';
const jwt = require('jsonwebtoken');
const config = require('../config');

class ProjectInvite extends Model {

  id: number;
  projectId: number;
  name: string;
  email: string;
  userId: number;
  accepted: boolean;
  createdAt: Date;
  modifiedAt: Date;

  static get tableName(): string {
    return 'projectInvite';
  }

  static get relationMappings(): RelationMappings {
    return {
      project: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/Project`,
        join: {
          from: 'projectInvite.projectId',
          to: 'project.id'
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/User`,
        join: {
          from: 'projectInvite.userId',
          to: 'user.id'
        }
      }
    };
  }

  static get jsonSchema(): object {
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

  static generateInviteToken(projectInviteId: number, projectName: string, projectId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        {projectInviteId, projectName, projectId},
        `invite${config.SECRET_KEY}`,
        {expiresIn: '7 days'},
        function (err: object, token: string) {
          if (err) {
            reject(err);
          } else {
            resolve(token);
          }
        }
      );
    });
  }

  static verifyInviteToken(token: string): Promise<object> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        `invite${config.SECRET_KEY}`,
        function (err: object, payload: object) {
          if (err) {
            reject(err);
          } else {
            resolve(payload);
          }
        }
      );
    });
  }

  static bulkDelete(arrayOfIds: number[], projectId: number, trx: Transaction): QueryBuilder<ProjectInvite> {
    return ProjectInvite
      .query(trx)
      .whereIn('id', arrayOfIds)
      .andWhere('projectId', projectId)
      .delete();
  }

  static accept(id: number, trx: Transaction) {
    return ProjectInvite
      .query(trx)
      .patch({accepted: true})
      .where({
        'id': id,
        'accepted': false
      })
      .returning('*')
      .first();
  }

}

module.exports = ProjectInvite;
