"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objection_1 = require("objection");
const jwt = require("jsonwebtoken");
const config_1 = require("../config");
class ProjectInvite extends objection_1.Model {
    static get tableName() {
        return 'projectInvite';
    }
    static get relationMappings() {
        return {
            project: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: `${__dirname}/Project`,
                join: {
                    from: 'projectInvite.projectId',
                    to: 'project.id'
                }
            },
            user: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: `${__dirname}/User`,
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
            jwt.sign({ projectInviteId, projectName, projectId }, `invite${config_1.default.SECRET_KEY}`, { expiresIn: '7 days' }, (err, token) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(token);
                }
            });
        });
    }
    static verifyInviteToken(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, `invite${config_1.default.SECRET_KEY}`, undefined, (err, decoded) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(decoded);
                }
            });
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
            .patch({ accepted: true })
            .returning('*')
            .where({
            id,
            accepted: false
        })
            .first();
    }
}
exports.default = ProjectInvite;
