"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Project_1 = require("../models/Project");
const BaseViewSet_1 = require("./BaseViewSet");
const ValidationError_1 = require("../errors/ValidationError");
const validate_1 = require("../utils/validate");
const middleware_1 = require("../authentication/jwt/middleware");
const middleware_2 = require("../authorization/middleware");
class ProjectViewSet extends BaseViewSet_1.default {
    constructor(options) {
        super(Project_1.default, options);
        const id = this.getIdRouteParameter();
        this.updateMember = this.updateMember.bind(this);
        this.router.post(`:${id}(\\d+)/update-member`, middleware_2.requirePermission(`${this.Model.tableName}:update`), this.updateMember);
    }
    getCommonMiddleware() {
        return [middleware_1.requireAuthentication];
    }
    getListQueryBuilder(ctx) {
        // We only list projects where the authenticated user is the project owner
        // OR where they are a member.
        const { user } = ctx.state;
        return Project_1.default
            .query()
            .distinct('project.*')
            .eager('user')
            .leftJoinRelation('members')
            .where('project.userId', user.id)
            .orWhere(function () {
            this.where({
                'members.id': user.id,
                'members_join.membershipIsActive': true
            });
        });
    }
    getRetrieveQueryBuilder() {
        return Project_1.default
            .query()
            .eager('[user, members]');
    }
    getCreateQueryBuilder() {
        return Project_1.default
            .query()
            .eager('[user, members]');
    }
    getUpdateQueryBuilder() {
        return Project_1.default
            .query()
            .eager('[user, members]');
    }
    async create(ctx) {
        ctx.request.body.userId = ctx.state.user.id;
        delete ctx.request.body.user;
        delete ctx.request.body.members;
        return super.create(ctx);
    }
    async update(ctx) {
        delete ctx.request.body.user;
        delete ctx.request.body.userId;
        delete ctx.request.body.members;
        return super.update(ctx);
    }
    async updateMember(ctx) {
        const { project } = ctx.state;
        try {
            await validate_1.default.async(ctx.request.body, {
                userId: {
                    presence: true,
                    projectMember: {
                        project
                    }
                },
                membershipIsActive: {
                    boolean: true
                },
                membershipType: {
                    inclusion: ['author', 'admin']
                }
            });
        }
        catch (errors) {
            const err = new ValidationError_1.default();
            err.errors = errors;
            throw err;
        }
        const { userId, membershipIsActive, membershipType } = ctx.request.body;
        await project.updateUserMembership(userId, membershipIsActive, membershipType);
        ctx.body = await project.getUserById(userId);
    }
}
exports.default = ProjectViewSet;
