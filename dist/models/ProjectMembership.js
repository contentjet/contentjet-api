"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objection_1 = require("objection");
class ProjectMembership extends objection_1.Model {
    static get tableName() {
        return 'projectmembership';
    }
    static get relationMappings() {
        return {
            user: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: `${__dirname}/User`,
                join: {
                    from: 'projectmembership.userId',
                    to: 'user.id'
                }
            },
            project: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: `${__dirname}/Project`,
                join: {
                    from: 'projectmembership.projectId',
                    to: 'project.id'
                }
            }
        };
    }
}
exports.default = ProjectMembership;
