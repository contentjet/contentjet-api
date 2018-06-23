"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const middleware_1 = require("../authentication/jwt/middleware");
const BaseViewSet_1 = require("./BaseViewSet");
const WebHook_1 = require("../models/WebHook");
class WebHookViewSet extends BaseViewSet_1.default {
    constructor(options) {
        super(WebHook_1.default, options);
    }
    getCommonMiddleware() {
        return [middleware_1.requireAuthentication];
    }
    getListQueryBuilder(ctx) {
        return super
            .getListQueryBuilder(ctx)
            .where('projectId', ctx.state.project.id);
    }
    getRetrieveQueryBuilder(ctx) {
        return super
            .getRetrieveQueryBuilder(ctx)
            .where('projectId', ctx.state.project.id);
    }
    getPageSize() {
        return 0;
    }
    async create(ctx) {
        ctx.request.body.projectId = ctx.state.project.id;
        return super.create(ctx);
    }
    async update(ctx) {
        ctx.request.body.projectId = ctx.state.project.id;
        return super.update(ctx);
    }
}
exports.default = WebHookViewSet;
