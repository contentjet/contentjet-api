"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EntryType_1 = require("../models/EntryType");
const BaseViewSet_1 = require("./BaseViewSet");
const middleware_1 = require("../authentication/jwt/middleware");
class EntryTypeViewSet extends BaseViewSet_1.default {
    constructor(options) {
        super(EntryType_1.default, options);
    }
    getCommonMiddleware() {
        return [middleware_1.requireAuthentication];
    }
    getListQueryBuilder(ctx) {
        return super
            .getListQueryBuilder(ctx)
            .where('entryType.projectId', ctx.state.project.id)
            .orderBy('entryType.modifiedAt', 'desc');
    }
    getRetrieveQueryBuilder(ctx) {
        return super
            .getRetrieveQueryBuilder(ctx)
            .where('projectId', ctx.state.project.id);
    }
    async create(ctx) {
        ctx.request.body.projectId = ctx.state.project.id;
        ctx.request.body.userId = ctx.state.user.id;
        return super.create(ctx);
    }
    async update(ctx) {
        ctx.request.body.projectId = ctx.state.project.id;
        ctx.request.body.userId = ctx.state.user.id;
        return super.update(ctx);
    }
}
exports.default = EntryTypeViewSet;
