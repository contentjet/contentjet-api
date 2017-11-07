const Model = require('objection').Model;

class Permission extends Model {

  static get tableName() {
    return 'permission';
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

  static getOrCreate(name) {
    return Permission
      .query()
      .where('name', name)
      .first()
      .then(permission => {
        if (permission) return permission;
        return Permission.create(name);
      });
  }

  static create(name) {
    return Permission
      .query()
      .insert({name});
  }

}

module.exports = Permission;
