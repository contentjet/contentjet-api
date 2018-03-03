"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objection_1 = require("objection");
class ProjectMembership extends objection_1.Model {
    static get tableName() {
        return 'projectMembership';
    }
    static get relationMappings() {
        return {
            user: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: `${__dirname}/User`,
                join: {
                    from: 'projectMembership.userId',
                    to: 'user.id'
                }
            },
            project: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: `${__dirname}/Project`,
                join: {
                    from: 'projectMembership.projectId',
                    to: 'project.id'
                }
            }
        };
    }
}
exports.default = ProjectMembership;
