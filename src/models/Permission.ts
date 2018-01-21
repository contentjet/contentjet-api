import {Model, QueryBuilderSingle} from 'objection';

export default class Permission extends Model {

  id: number;
  name: string;

  static get tableName(): string {
    return 'permission';
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

  static async getOrCreate(name: string): Promise<Permission> {
    const permission = await Permission
      .query()
      .where('name', name)
      .first()
    if (permission) return permission;
    return await Permission.create(name);
  }

  static create(name: string): QueryBuilderSingle<Permission> {
    return Permission
      .query()
      .insert({name});
  }

}
