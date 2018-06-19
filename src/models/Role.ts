import { Model, RelationMappings, QueryBuilderSingle, QueryBuilder } from 'objection';
import Permission from './Permission';

export default class Role extends Model {

  id!: number;
  name!: string;

  static get tableName(): string {
    return 'role';
  }

  static get relationMappings(): RelationMappings {
    return {
      permissions: {
        relation: Model.ManyToManyRelation,
        modelClass: `${__dirname}/Permission`,
        join: {
          from: 'role.id',
          through: {
            from: 'role_permission.roleId',
            to: 'role_permission.permissionId'
          },
          to: 'permission.id'
        }
      },
      users: {
        relation: Model.ManyToManyRelation,
        modelClass: `${__dirname}/User`,
        join: {
          from: 'role.id',
          through: {
            from: 'user_role.roleId',
            to: 'user_role.userId'
          },
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
          minLength: 1,
          maxLength: 64
        }
      },
      required: [
        'name'
      ]
    };
  }

  static getOrCreate(name: string): Promise<Role> {
    return Role
      .query()
      .where('name', name)
      .first()
      .then(role => {
        if (role) return role;
        return Role.create(name);
      });
  }

  static create(name: string): QueryBuilderSingle<Role> {
    return Role
      .query()
      .insert({name});
  }

  assignPermission(permissionId: number): QueryBuilder<Permission> {
    return this.$relatedQuery<Permission>('permissions').relate(permissionId);
  }

  unassignPermission(permissionId: number): QueryBuilder<Permission> {
    return this.$relatedQuery<Permission>('permissions').unrelate().where('id', permissionId);
  }

}
