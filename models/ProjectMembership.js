const Model = require('objection').Model;

class ProjectMembership extends Model {

  static get tableName() {
    return 'projectmembership';
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/User`,
        join: {
          from: 'projectmembership.userId',
          to: 'user.id'
        }
      },
      project: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/Project`,
        join: {
          from: 'projectmembership.projectId',
          to: 'project.id'
        }
      }
    };
  }

}

module.exports = ProjectMembership;
