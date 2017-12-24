import {Model, RelationMappings} from 'objection';

export default class ProjectMembership extends Model {

  id: number;
  userId: number;
  projectId: number;
  membershipType: string;
  membershipIsActive: boolean;

  static get tableName(): string {
    return 'projectmembership';
  }

  static get relationMappings(): RelationMappings {
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
