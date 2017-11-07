const config = require('../config');
const Model = require('objection').Model;
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ValidationError = require('../errors/ValidationError');
const Role = require('./Role');
const Permission = require('./Permission');

class User extends Model {

  static get tableName() {
    return 'user';
  }

  static get relationMappings() {
    return {
      roles: {
        relation: Model.ManyToManyRelation,
        modelClass: Role,
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

  static authenticate(email, password) {
    const hash = crypto.createHash('sha256');
    const hashedPassword = hash.update(`${config.SECRET_KEY}${password}`).digest('hex');
    return User
      .query()
      .where('email', email)
      .andWhere('password', hashedPassword)
      .first();
  }

  static getById(id, trx) {
    return User
      .query(trx)
      .where('id', id)
      .first();
  }

  static existsWithEmail(email, trx) {
    return User.query(trx)
      .count('*')
      .where('email', email)
      .first()
      .then(result => parseInt(result.count) === 1);
  }

  static async create(email, name, password, isActive = false, trx) {
    const exists = await User.existsWithEmail(email, trx);
    if (exists) throw new ValidationError('A user with this email already exists');
    const hash = crypto.createHash('sha256');
    const hashedPassword = hash.update(`${config.SECRET_KEY}${password}`).digest('hex');
    return User
      .query(trx)
      .insert({email, name, password: hashedPassword, isActive})
      .returning('*');
  }

  static setPassword(userId, password) {
    const hash = crypto.createHash('sha256');
    const hashedPassword = hash.update(`${config.SECRET_KEY}${password}`).digest('hex');
    return User
      .query()
      .patch({password: hashedPassword})
      .where('id', userId)
      .returning('*')
      .first();
  }

  static deleteAll() {
    return User
      .query()
      .delete();
  }

  static generateSignUpToken(userId) {
    return new Promise((resolve, reject) => {
      jwt.sign(
        {userId},
        `sign-up${config.SECRET_KEY}`,
        {expiresIn: '7 days'},
        function (err, token) {
          if (err) {
            reject(err);
          } else {
            resolve(token);
          }
        }
      );
    });
  }

  static verifySignUpToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        `sign-up${config.SECRET_KEY}`,
        function (err, payload) {
          if (err) {
            reject(err);
          } else {
            resolve(payload);
          }
        }
      );
    });
  }

  static generatePasswordResetToken(userId) {
    return new Promise((resolve, reject) => {
      jwt.sign(
        {userId},
        `password-reset${config.SECRET_KEY}`,
        {expiresIn: '12 hours'},
        function (err, token) {
          if (err) {
            reject(err);
          } else {
            resolve(token);
          }
        }
      );
    });
  }

  static verifyPasswordResetToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        `password-reset${config.SECRET_KEY}`,
        function (err, payload) {
          if (err) {
            reject(err);
          } else {
            resolve(payload);
          }
        }
      );
    });
  }

  assignRole(role) {
    return this
      .$relatedQuery('roles')
      .relate(role.id);
  }

  unassignRole(role) {
    return this
      .$relatedQuery('roles')
      .unrelate()
      .where('id', role.id);
  }

  getPermissions() {
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

  hasPermission(permissionName) {
    return this.getPermissions().then(permissions => {
      if (!permissions) return false;
      return permissions.map(p => p.name).includes(permissionName);
    });
  }

  delete() {
    return User
      .query()
      .deleteById(this.id);
  }

  $formatJson(json) {
    json = super.$formatJson(json);
    if ('password' in json) delete json.password;
    return json;
  }

}

module.exports = User;
