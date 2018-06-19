"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Client_1 = require("../models/Client");
const BaseViewSet_1 = require("./BaseViewSet");
const middleware_1 = require("../authentication/jwt/middleware");
const routes_1 = require("../authentication/jwt/routes");
const lodash_1 = require("lodash");
class ClientViewSet extends BaseViewSet_1.default {
    constructor(options) {
        const clonedOptions = lodash_1.cloneDeep(options);
        clonedOptions.disabledActions = ['update'];
        super(Client_1.default, options);
        this.router.post('authenticate', routes_1.authenticateClient);
    }
    getPageSize() {
        return 0;
    }
    getListMiddleware() {
        const middleware = [middleware_1.requireAuthentication];
        return middleware.concat(super.getListMiddleware());
    }
    getCreateMiddleware() {
        const middleware = [middleware_1.requireAuthentication];
        return middleware.concat(super.getCreateMiddleware());
    }
    getRetrieveMiddleware() {
        const middleware = [middleware_1.requireAuthentication];
        return middleware.concat(super.getRetrieveMiddleware());
    }
    getDeleteMiddleware() {
        const middleware = [middleware_1.requireAuthentication];
        return middleware.concat(super.getDeleteMiddleware());
    }
    getListQueryBuilder(ctx) {
        return super
            .getListQueryBuilder(ctx)
            .where('client.projectId', ctx.state.project.id)
            .orderBy('client.modifiedAt', 'desc');
    }
    getRetrieveQueryBuilder(ctx) {
        return super
            .getRetrieveQueryBuilder(ctx)
            .where('projectId', ctx.state.project.id);
    }
    async create(ctx) {
        ctx.request.body.projectId = ctx.state.project.id;
        ctx.request.body.clientId = Client_1.default.generateRandomString();
        ctx.request.body.clientSecret = Client_1.default.generateRandomString();
        return super.create(ctx);
    }
}
exports.default = ClientViewSet;
