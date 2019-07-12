"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objection_1 = require("objection");
class Role extends objection_1.Model {
    static get tableName() {
        return 'role';
    }
    static get relationMappings() {
        return {
            permissions: {
                relation: objection_1.Model.ManyToManyRelation,
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
                relation: objection_1.Model.ManyToManyRelation,
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
            required: ['name']
        };
    }
    static getOrCreate(name) {
        return Role.query()
            .where('name', name)
            .first()
            .then(role => {
            if (role)
                return role;
            return Role.create(name);
        });
    }
    static create(name) {
        return Role.query().insert({ name });
    }
    assignPermission(permissionId) {
        return this.$relatedQuery('permissions').relate(permissionId);
    }
    unassignPermission(permissionId) {
        return this.$relatedQuery('permissions')
            .unrelate()
            .where('id', permissionId);
    }
}
exports.default = Role;
