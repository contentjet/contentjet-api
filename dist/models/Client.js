"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objection_1 = require("objection");
const uuid = require("uuid");
class Client extends objection_1.Model {
    static get tableName() {
        return 'client';
    }
    static get relationMappings() {
        return {
            project: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: `${__dirname}/Project`,
                join: {
                    from: 'client.projectId',
                    to: 'project.id'
                }
            }
        };
    }
    static get jsonSchema() {
        return {
            type: 'object',
            additionalProperties: false,
            properties: {
                id: {
                    type: 'integer'
                },
                projectId: {
                    type: 'integer'
                },
                name: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 64
                },
                clientId: {
                    type: 'string',
                    minLength: 32,
                    maxLength: 32
                },
                clientSecret: {
                    type: 'string',
                    minLength: 32,
                    maxLength: 32
                },
                createdAt: {
                    type: 'string',
                    format: 'date-time'
                },
                modifiedAt: {
                    type: 'string',
                    format: 'date-time'
                }
            },
            required: ['name', 'clientId', 'clientSecret']
        };
    }
    static getById(id, trx) {
        return Client.query(trx)
            .where('id', id)
            .first();
    }
    static async deleteAll(trx) {
        const num = await Client.query(trx).delete();
        return num;
    }
    static generateRandomString() {
        return uuid.v4().replace(/-/g, '');
    }
    static async create(projectId, name, trx) {
        return await Client.query(trx).insert({
            clientId: Client.generateRandomString(),
            clientSecret: Client.generateRandomString(),
            name,
            projectId
        });
    }
    static authenticate(clientId, clientSecret) {
        return Client.query()
            .where({ clientId, clientSecret })
            .first();
    }
    $beforeInsert() {
        this.clientId = uuid.v4().replace(/-/g, '');
        this.clientSecret = uuid.v4().replace(/-/g, '');
    }
    delete(trx) {
        return Client.query(trx).deleteById(this.id);
    }
}
exports.default = Client;
