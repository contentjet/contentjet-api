"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objection_1 = require("objection");
class Permission extends objection_1.Model {
    static async getOrCreate(name) {
        const permission = await Permission
            .query()
            .where('name', name)
            .first();
        if (permission)
            return permission;
        return await Permission.create(name);
    }
    static create(name) {
        return Permission
            .query()
            .insert({ name });
    }
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
}
exports.default = Permission;
