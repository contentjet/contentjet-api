const config = require('../config');
import {Model, QueryBuilder, QueryBuilderSingle, QueryBuilderOption, RelationMappings, Transaction} from 'objection';
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
import ValidationError from '../errors/ValidationError';
import Permission from './Permission';

export default class User extends Model {

  id: number;
  email: string
  password: string
  name: string
  isActive: boolean;
  isAdmin: boolean;
  createdAt: Date;
  modifiedAt: Date;
  _permissions?: Permission[];

  static get tableName() {
    return 'user';
  }

  static get relationMappings(): RelationMappings {
    return {
      roles: {
        relation: Model.ManyToManyRelation,
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

  static get jsonSchema(): object {
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

  static authenticate(email: string, password: string): QueryBuilderOption<User> {
    const hash = crypto.createHash('sha256');
    const hashedPassword = hash.update(`${config.SECRET_KEY}${password}`).digest('hex');
    return User
      .query()
      .where('email', email)
      .andWhere('password', hashedPassword)
      .first();
  }

  static getById(id: number, trx?: Transaction): QueryBuilderOption<User> {
    return User
      .query(trx)
      .where('id', id)
      .first();
  }

  static async existsWithEmail(email: string, trx?: Transaction): Promise<boolean> {
    const result = await User.query(trx)
      .count('*')
      .where('email', email)
      .first() as any;
    return parseInt(result.count) === 1;
  }

  static async create(email: string, name: string, password: string, isActive = false, isAdmin = false, trx?: Transaction): Promise<User> {
    const exists = await User.existsWithEmail(email, trx);
    if (exists) throw new ValidationError('A user with this email already exists');
    const hash = crypto.createHash('sha256');
    const hashedPassword = hash.update(`${config.SECRET_KEY}${password}`).digest('hex');
    return await User
      .query(trx)
      .insert({email, name, password: hashedPassword, isActive, isAdmin})
      .returning('*')
      .first() as User;
  }

  static async setPassword(userId: number, password: string) {
    const hash = crypto.createHash('sha256');
    const hashedPassword = hash.update(`${config.SECRET_KEY}${password}`).digest('hex');
    return await User
      .query()
      .patch({password: hashedPassword})
      .where('id', userId)
      .returning('*')
      .first();
  }

  static deleteAll(): QueryBuilder<User> {
    return User
      .query()
      .delete();
  }

  static generateSignUpToken(userId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        {userId},
        `sign-up${config.SECRET_KEY}`,
        {expiresIn: '7 days'},
        function (err: Object, token: string) {
          if (err) {
            reject(err);
          } else {
            resolve(token);
          }
        }
      );
    });
  }

  static verifySignUpToken(token: string): Promise<object> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        `sign-up${config.SECRET_KEY}`,
        function (err: Object, payload: Object) {
          if (err) {
            reject(err);
          } else {
            resolve(payload);
          }
        }
      );
    });
  }

  static generatePasswordResetToken(userId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        {userId},
        `password-reset${config.SECRET_KEY}`,
        {expiresIn: '12 hours'},
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

  static verifyPasswordResetToken(token: string): object {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        `password-reset${config.SECRET_KEY}`,
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

  assignRole(roleId: number): QueryBuilder<Model> {
    return this
      .$relatedQuery('roles')
      .relate(roleId);
  }

  unassignRole(roleId: number): QueryBuilder<Model> {
    return this
      .$relatedQuery('roles')
      .unrelate()
      .where('id', roleId);
  }

  getPermissions(): Promise<Permission[]> {
    if (this._permissions) return Promise.resolve(this._permissions);
    return Permission
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

  hasPermission(permissionName: string): Promise<boolean> {
    return this.getPermissions().then(permissions => {
      if (!permissions) return false;
      return permissions.map(p => p.name).includes(permissionName);
    });
  }

  delete(): QueryBuilderSingle<number> {
    return User
      .query()
      .deleteById(this.id);
  }

  $formatJson(json: object): object {
    const data: any = super.$formatJson(json);
    if ('password' in data) delete data.password;
    return data;
  }

}
