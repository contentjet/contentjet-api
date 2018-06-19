"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Router = require("koa-router");
const lodash_1 = require("lodash");
const moment = require("moment");
const NotFoundError_1 = require("../errors/NotFoundError");
const DatabaseError_1 = require("../errors/DatabaseError");
const middleware_1 = require("../authorization/middleware");
class BaseViewSet {
    constructor(M, options) {
        this.modelClass = M;
        this.options = options;
        const { disabledActions = [] } = options;
        this.list = this.list.bind(this);
        this.getListMiddleware = this.getListMiddleware.bind(this);
        this.create = this.create.bind(this);
        this.getCreateMiddleware = this.getCreateMiddleware.bind(this);
        this.retrieve = this.retrieve.bind(this);
        this.getRetrieveMiddleware = this.getRetrieveMiddleware.bind(this);
        this.update = this.update.bind(this);
        this.getUpdateMiddleware = this.getUpdateMiddleware.bind(this);
        this.delete = this.delete.bind(this);
        this.getDeleteMiddleware = this.getDeleteMiddleware.bind(this);
        this.router = new Router(this.getRouterOptions());
        const commonMiddleware = this.getCommonMiddleware();
        const id = this.getIdRouteParameter();
        if (!disabledActions.includes('list')) {
            this.router.get('/', ...commonMiddleware, ...this.getListMiddleware(), this.list);
        }
        if (!disabledActions.includes('create')) {
            this.router.post('/', ...commonMiddleware, ...this.getCreateMiddleware(), this.create);
        }
        if (!disabledActions.includes('retrieve')) {
            this.router.get(`:${id}(\\d+)`, ...commonMiddleware, ...this.getRetrieveMiddleware(), this.retrieve);
        }
        if (!disabledActions.includes('update')) {
            this.router.put(`:${id}(\\d+)`, ...commonMiddleware, ...this.getUpdateMiddleware(), this.update);
        }
        if (!disabledActions.includes('delete')) {
            this.router.delete(`:${id}(\\d+)`, ...commonMiddleware, ...this.getDeleteMiddleware(), this.delete);
        }
    }
    getIdRouteParameter() {
        return `${this.modelClass.tableName}Id`;
    }
    getRouterOptions() {
        return undefined;
    }
    getCommonMiddleware() {
        return [];
    }
    getPageSize(_ctx) {
        return 30;
    }
    getListQueryBuilder(_ctx) {
        return this.modelClass.query();
    }
    getRetrieveQueryBuilder(_ctx) {
        return this.modelClass.query();
    }
    getCreateQueryBuilder(_ctx) {
        return this.modelClass.query();
    }
    getUpdateQueryBuilder(_ctx) {
        return this.modelClass.query();
    }
    getDeleteQueryBuilder(_ctx) {
        return this.modelClass.query();
    }
    getListMiddleware() {
        return [middleware_1.requirePermission(`${this.modelClass.tableName}:list`)];
    }
    getColumnNames() {
        return Object.keys(this.modelClass.jsonSchema.properties);
    }
    async list(ctx) {
        const limit = this.getPageSize(ctx);
        let page = parseInt(ctx.request.query.page || 1, 10);
        if (page < 1)
            page = 1;
        let result;
        if (limit) {
            result = await this.getListQueryBuilder(ctx).page(page - 1, limit);
            result = {
                page,
                totalPages: Math.ceil(result.total / limit),
                totalRecords: result.total,
                results: result.results
            };
        }
        else {
            result = await this.getListQueryBuilder(ctx);
        }
        ctx.body = result;
        ctx.state.viewsetResult = {
            action: 'retrieve',
            modelClass: this.modelClass,
            data: result
        };
        return result;
    }
    getCreateMiddleware() {
        return [middleware_1.requirePermission(`${this.modelClass.tableName}:create`)];
    }
    async create(ctx) {
        const data = lodash_1.pick(ctx.request.body, this.getColumnNames());
        const model = await this.getCreateQueryBuilder(ctx)
            .insert(data)
            .returning('*')
            .first();
        if (!model)
            throw new DatabaseError_1.default();
        ctx.status = 201;
        ctx.body = model;
        ctx.state.viewsetResult = {
            action: 'create',
            modelClass: this.modelClass,
            data: model
        };
        return model;
    }
    getRetrieveMiddleware() {
        return [middleware_1.requirePermission(`${this.modelClass.tableName}:retrieve`)];
    }
    async retrieve(ctx) {
        const id = ctx.params[this.getIdRouteParameter()];
        const model = await this
            .getRetrieveQueryBuilder(ctx)
            .where(`${this.modelClass.tableName}.id`, id)
            .first();
        if (!model)
            throw new NotFoundError_1.default();
        ctx.body = model;
        ctx.state.viewsetResult = {
            action: 'retrieve',
            modelClass: this.modelClass,
            data: model
        };
        return model;
    }
    getUpdateMiddleware() {
        return [middleware_1.requirePermission(`${this.modelClass.tableName}:update`)];
    }
    async update(ctx) {
        const id = ctx.params[this.getIdRouteParameter()];
        const data = lodash_1.pick(ctx.request.body, this.getColumnNames());
        delete data.createdAt;
        data.id = parseInt(id, 10);
        data.modifiedAt = moment().format();
        const model = await this.getUpdateQueryBuilder(ctx)
            .update(data)
            .returning('*')
            .where(`${this.modelClass.tableName}.id`, id)
            .first();
        if (model) {
            ctx.body = model;
            ctx.state.viewsetResult = {
                action: 'update',
                modelClass: this.modelClass,
                data: model
            };
        }
        else {
            ctx.status = 404;
        }
        return model;
    }
    getDeleteMiddleware() {
        return [middleware_1.requirePermission(`${this.modelClass.tableName}:delete`)];
    }
    async delete(ctx) {
        const id = ctx.params[this.getIdRouteParameter()];
        await this.getDeleteQueryBuilder(ctx)
            .where(`${this.modelClass.tableName}.id`, id)
            .delete();
        ctx.status = 204;
        ctx.state.viewsetResult = {
            action: 'delete',
            modelClass: this.modelClass,
            data: { id }
        };
    }
    routes() {
        return this.router.routes();
    }
}
exports.default = BaseViewSet;
