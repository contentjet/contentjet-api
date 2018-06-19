"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const objection_1 = require("objection");
const jwt = require("jsonwebtoken");
// const crypto = require('crypto');
const crypto = require("crypto");
const ValidationError_1 = require("../errors/ValidationError");
const Permission_1 = require("./Permission");
class User extends objection_1.Model {
    static get tableName() {
        return 'user';
    }
    static get relationMappings() {
        return {
            roles: {
                relation: objection_1.Model.ManyToManyRelation,
                modelClass: `${__dirname}/Role`,
                join: {
                    from: 'user.id',
                    through: {
                        from: 'user_role.userId',
                        to: 'user_role.roleId'
                    },
                    to: 'role.id'
                }
            }
        };
    }
    static get jsonSchema() {
        return {
            type: 'object',
            additionalProperties: false,
            properties: {
                email: {
                    type: 'string',
                    format: 'email'
                },
                password: {
                    type: 'string',
                    minLength: 64,
                    maxLength: 64
                },
                name: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 128
                },
                isActive: {
                    type: 'boolean',
                    default: false
                },
                isAdmin: {
                    type: 'boolean',
                    default: false
                }
            },
            required: [
                'email',
                'password',
                'name'
            ]
        };
    }
    static hashPassword(password) {
        return crypto
            .createHash('sha256')
            .update(`${config_1.default.SECRET_KEY}${password}`)
            .digest('hex');
    }
    static authenticate(email, password) {
        return User
            .query()
            .where('email', email)
            .andWhere('password', User.hashPassword(password))
            .first();
    }
    static getById(id, trx) {
        return User
            .query(trx)
            .where('id', id)
            .first();
    }
    static async existsWithEmail(email, trx) {
        const result = await User
            .query(trx)
            .count('*')
            .where('email', email)
            .first();
        return parseInt(result.count, 10) === 1;
    }
    static async create(email, name, password, isActive = false, isAdmin = false, trx) {
        const exists = await User.existsWithEmail(email, trx);
        if (exists)
            throw new ValidationError_1.default('A user with this email already exists');
        return await User
            .query(trx)
            .insert({ email, name, password: User.hashPassword(password), isActive, isAdmin })
            .returning('*')
            .first();
    }
    static async setPassword(userId, password) {
        return await User
            .query()
            .patch({ password: User.hashPassword(password) })
            .returning('*')
            .where('id', userId)
            .first();
    }
    static deleteAll() {
        return User
            .query()
            .delete();
    }
    static generateSignUpToken(userId) {
        const payload = { userId };
        return new Promise((resolve, reject) => {
            jwt.sign(payload, `sign-up${config_1.default.SECRET_KEY}`, { expiresIn: '7 days' }, (err, token) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(token);
                }
            });
        });
    }
    static verifySignUpToken(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, `sign-up${config_1.default.SECRET_KEY}`, undefined, (err, decoded) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(decoded);
                }
            });
        });
    }
    static generatePasswordResetToken(userId) {
        const payload = { userId };
        return new Promise((resolve, reject) => {
            jwt.sign(payload, `password-reset${config_1.default.SECRET_KEY}`, { expiresIn: '12 hours' }, (err, token) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(token);
                }
            });
        });
    }
    static verifyPasswordResetToken(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, `password-reset${config_1.default.SECRET_KEY}`, undefined, (err, decoded) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(decoded);
                }
            });
        });
    }
    verifyPassword(password) {
        return this.password === User.hashPassword(password);
    }
    assignRole(roleId) {
        return this
            .$relatedQuery('roles')
            .relate(roleId);
    }
    unassignRole(roleId) {
        return this
            .$relatedQuery('roles')
            .unrelate()
            .where('id', roleId);
    }
    getPermissions() {
        if (this._permissions)
            return Promise.resolve(this._permissions);
        return Permission_1.default
            .query()
            .join('role_permission', 'permission.id', 'role_permission.permissionId')
            .join('role', 'role.id', 'role_permission.roleId')
            .join('user_role', 'role.id', 'user_role.roleId')
            .join('user', 'user.id', 'user_role.userId')
            .groupBy('permission.id')
            .where('user.id', this.id)
            .then(permissions => {
            this._permissions = permissions;
            return permissions;
        });
    }
    hasPermission(permissionName) {
        return this.getPermissions().then(permissions => {
            if (!permissions)
                return false;
            return permissions.map(p => p.name).includes(permissionName);
        });
    }
    delete() {
        return User
            .query()
            .deleteById(this.id);
    }
    $formatJson(json) {
        const data = super.$formatJson(json);
        if ('password' in data)
            delete data.password;
        return data;
    }
}
exports.default = User;
