"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objection_1 = require("objection");
const ProjectMembership_1 = require("./ProjectMembership");
class Project extends objection_1.Model {
    static get tableName() {
        return 'project';
    }
    static get relationMappings() {
        return {
            user: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: `${__dirname}/User`,
                join: {
                    from: 'project.userId',
                    to: 'user.id'
                }
            },
            members: {
                relation: objection_1.Model.ManyToManyRelation,
                modelClass: `${__dirname}/User`,
                join: {
                    from: 'project.id',
                    through: {
                        from: 'projectMembership.projectId',
                        to: 'projectMembership.userId',
                        extra: ['membershipType', 'membershipIsActive']
                    },
                    to: 'user.id'
                }
            },
            webHooks: {
                relation: objection_1.Model.HasManyRelation,
                modelClass: `${__dirname}/WebHook`,
                join: {
                    from: 'project.id',
                    to: 'webHook.projectId'
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
                name: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 64
                },
                metadata: {
                    type: 'string',
                    default: '',
                    maxLength: 3000
                },
                userId: {
                    type: 'integer'
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
            required: ['name', 'userId']
        };
    }
    static getById(id, trx) {
        return Project.query(trx)
            .where('id', id)
            .first();
    }
    static async deleteAll(trx) {
        const num = await Project.query(trx).delete();
        return num;
    }
    async getUsers(trx) {
        return await this.$relatedQuery('members', trx);
    }
    getUserById(id, trx) {
        return this.$relatedQuery('members', trx)
            .where('id', id)
            .first();
    }
    _isMember(userId, membershipType, trx) {
        let query = this.$relatedQuery('members', trx).where('id', userId);
        if (membershipType) {
            query = query.andWhere('membershipType', membershipType);
        }
        return query.first();
    }
    isMember(userId, membershipType, trx) {
        if (this.isOwner(userId))
            return Promise.resolve(true);
        return this._isMember(userId, membershipType, trx).then(id => !!id);
    }
    isActiveMember(userId, membershipType, trx) {
        if (this.isOwner(userId))
            return Promise.resolve(true);
        return this._isMember(userId, membershipType, trx)
            .andWhere('membershipIsActive', true)
            .then(id => !!id);
    }
    isOwner(userId) {
        return this.userId === userId;
    }
    getUsersByMembershipType(membershipType, trx) {
        return this.$relatedQuery('members', trx).where('membershipType', membershipType);
    }
    async addUser(user, membershipType, trx) {
        const existingUserId = await this.$relatedQuery('members', trx)
            .select('id')
            .where('id', user.id)
            .first();
        if (existingUserId)
            return user;
        await this.$relatedQuery('members', trx).relate({
            id: user.id,
            membershipType
        });
        return user;
    }
    removeUser(userId, trx) {
        return this.$relatedQuery('members', trx)
            .unrelate()
            .where('id', userId);
    }
    updateUserMembership(userId, membershipIsActive, membershipType, trx) {
        return ProjectMembership_1.default.query(trx)
            .patch({ membershipType, membershipIsActive })
            .where({
            userId,
            projectId: this.id
        });
    }
    delete(trx) {
        return Project.query(trx).deleteById(this.id);
    }
    getActiveWebHooks(trx) {
        return this.$relatedQuery('webHooks', trx).where('isActive', true);
    }
}
exports.default = Project;
