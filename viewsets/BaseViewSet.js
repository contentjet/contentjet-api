const Router = require('koa-router');
const _ = require('lodash');
const moment = require('moment');
const NotFoundError = require('../errors/NotFoundError');
const {requirePermission} = require('../authorization/middleware');

class BaseViewSet {

  constructor(Model, options) {
    this.Model = Model;
    this.options = options;

    const {disabledActions = []} = options;

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
    const middleware = this.getCommonMiddleware();
    if (middleware.length) this.router.use(...middleware);
    const id = this.getIdRouteParameter();
    if (!disabledActions.includes('list')) {
      this.router.get('/', ...this.getListMiddleware(), this.list);
    }
    if (!disabledActions.includes('create')) {
      this.router.post('/', ...this.getCreateMiddleware(), this.create);
    }
    if (!disabledActions.includes('retrieve')) {
      this.router.get(`:${id}(\\d+)`, ...this.getRetrieveMiddleware(), this.retrieve);
    }
    if (!disabledActions.includes('update')) {
      this.router.put(`:${id}(\\d+)`, ...this.getUpdateMiddleware(), this.update);
    }
    if (!disabledActions.includes('delete')) {
      this.router.delete(`:${id}(\\d+)`, ...this.getDeleteMiddleware(), this.delete);
    }
  }

  getIdRouteParameter() {
    return `${this.Model.tableName}Id`;
  }

  getRouterOptions() {
    return null;
  }

  getCommonMiddleware() {
    return [];
  }

  getPageSize(ctx) {
    return 30;
  }

  getListQueryBuilder(ctx) {
    return this.Model.query();
  }

  getRetrieveQueryBuilder(ctx) {
    return this.Model.query();
  }

  getCreateQueryBuilder(ctx) {
    return this.Model.query();
  }

  getUpdateQueryBuilder(ctx) {
    return this.Model.query();
  }

  getDeleteQueryBuilder(ctx) {
    return this.Model.query();
  }

  getListMiddleware() {
    return [requirePermission(`${this.Model.tableName}:list`)];
  }

  async list(ctx, next) {
    const limit = this.getPageSize(ctx);
    let page = parseInt(ctx.request.query.page || 1);
    if (page < 1) page = 1;
    let result;
    if (limit) {
      result = await this.getListQueryBuilder(ctx).page(page - 1, limit);
      result = {
        page: page,
        totalPages: Math.ceil(result.total / limit),
        totalRecords: result.total,
        results: result.results
      };
    } else {
      result = await this.getListQueryBuilder(ctx);
    }
    ctx.body = result;
    ctx.state.viewsetResult = {
      action: 'retrieve',
      modelClass: this.Model,
      data: result
    };
    return result;
  }

  getCreateMiddleware() {
    return [requirePermission(`${this.Model.tableName}:create`)];
  }

  async create(ctx, next) {
    const model = await this.getCreateQueryBuilder(ctx)
      .insert(ctx.request.body)
      .returning('*');
    ctx.status = 201;
    ctx.body = model;
    ctx.state.viewsetResult = {
      action: 'create',
      modelClass: this.Model,
      data: model
    };
    return model;
  }

  getRetrieveMiddleware() {
    return [requirePermission(`${this.Model.tableName}:retrieve`)];
  }

  async retrieve(ctx, next) {
    const id = ctx.params[this.getIdRouteParameter()];
    const model = await this.getRetrieveQueryBuilder(ctx)
      .where(`${this.Model.tableName}.id`, id)
      .first();
    if (!model) throw new NotFoundError();
    ctx.body = model;
    ctx.state.viewsetResult = {
      action: 'retrieve',
      modelClass: this.Model,
      data: model
    };
    return model;
  }

  getUpdateMiddleware() {
    return [requirePermission(`${this.Model.tableName}:update`)];
  }

  async update(ctx, next) {
    const id = ctx.params[this.getIdRouteParameter()];
    const data = _.clone(ctx.request.body);
    delete data['createdAt'];
    data.id = parseInt(id);
    data.modifiedAt = moment().format();
    const model = await this.getUpdateQueryBuilder(ctx)
      .update(data)
      .where(`${this.Model.tableName}.id`, id)
      .first()
      .returning('*');
    ctx.body = model;
    ctx.state.viewsetResult = {
      action: 'update',
      modelClass: this.Model,
      data: model
    };
    return model;
  }

  getDeleteMiddleware() {
    return [requirePermission(`${this.Model.tableName}:delete`)];
  }

  async delete(ctx, next) {
    const id = ctx.params[this.getIdRouteParameter()];
    await this.getDeleteQueryBuilder(ctx)
      .delete()
      .where(`${this.Model.tableName}.id`, id);
    ctx.status = 204;
    ctx.state.viewsetResult = {
      action: 'delete',
      modelClass: this.Model,
      data: {id}
    };
  }

  routes() {
    return this.router.routes();
  }

}

module.exports = BaseViewSet;
