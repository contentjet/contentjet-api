import {Model} from 'objection';


class Role extends Model {

  name: string;

  static get tableName() {
    return 'role';
  }

  static get relationMappings() {
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

  static get jsonSchema() {
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

  static getOrCreate(name: string) {
    return Role
      .query()
      .where('name', name)
      .first()
      .then(role => {
        if (role) return role;
        return Role.create(name);
      });
  }

  static create(name: string) {
    return Role
      .query()
      .insert({name});
  }

  assignPermission(permission) {
    return this.$relatedQuery('permissions').relate(permission.id);
  }

  unassignPermission(permission) {
    return this.$relatedQuery('permissions').unrelate().where('id', permission.id);
  }

}

module.exports = Role;
