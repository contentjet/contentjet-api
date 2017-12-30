import * as Router from 'koa-router';
import * as Koa from 'koa';
import {clone} from 'lodash';
import {Model, ModelClass, QueryBuilder} from 'objection';
import * as moment from 'moment';
const NotFoundError = require('../errors/NotFoundError');
import {requirePermission} from '../authorization/middleware';


class BaseViewSet {

  Model: ModelClass<any>;
  options: any;
  router: Router;

  constructor(Model: ModelClass<any>, options: any) {
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

  getIdRouteParameter(): string {
    return `${this.Model.tableName}Id`;
  }

  getRouterOptions(): Router.IRouterOptions | undefined {
    return undefined;
  }

  getCommonMiddleware(): Router.IMiddleware[] {
    return [];
  }

  getPageSize(ctx: Koa.Context): number {
    return 30;
  }

  getListQueryBuilder(ctx: Koa.Context): QueryBuilder<any> {
    return this.Model.query();
  }

  getRetrieveQueryBuilder(ctx: Koa.Context): QueryBuilder<any> {
    return this.Model.query();
  }

  getCreateQueryBuilder(ctx: Koa.Context): QueryBuilder<any> {
    return this.Model.query();
  }

  getUpdateQueryBuilder(ctx: Koa.Context): QueryBuilder<any> {
    return this.Model.query();
  }

  getDeleteQueryBuilder(ctx: Koa.Context): QueryBuilder<any> {
    return this.Model.query();
  }

  getListMiddleware(): Router.IMiddleware[] {
    return [requirePermission(`${this.Model.tableName}:list`)];
  }

  async list(ctx: Koa.Context) {
    const limit = this.getPageSize(ctx);
    let page = parseInt(ctx.request.query.page || 1);
    if (page < 1) page = 1;
    let result;
    if (limit) {
      result = await this.getListQueryBuilder(ctx).page(page - 1, limit) as any;
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

  getCreateMiddleware(): Router.IMiddleware[] {
    return [requirePermission(`${this.Model.tableName}:create`)];
  }

  async create(ctx: Koa.Context) {
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

  getRetrieveMiddleware(): Router.IMiddleware[] {
    return [requirePermission(`${this.Model.tableName}:retrieve`)];
  }

  async retrieve(ctx: Koa.Context): Promise<Model> {
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

  getUpdateMiddleware(): Router.IMiddleware[] {
    return [requirePermission(`${this.Model.tableName}:update`)];
  }

  async update(ctx: Koa.Context) {
    const id = ctx.params[this.getIdRouteParameter()];
    const data = clone(ctx.request.body);
    delete data['createdAt'];
    data.id = parseInt(id);
    data.modifiedAt = moment().format();
    const model = await this.getUpdateQueryBuilder(ctx)
      .update(data)
      .where(`${this.Model.tableName}.id`, id)
      .first()
      .returning('*');
    if (model) {
      ctx.body = model;
      ctx.state.viewsetResult = {
        action: 'update',
        modelClass: this.Model,
        data: model
      };
    } else {
      ctx.status = 404;
    }
    return model;
  }

  getDeleteMiddleware(): Router.IMiddleware[] {
    return [requirePermission(`${this.Model.tableName}:delete`)];
  }

  async delete(ctx: Koa.Context): Promise<void> {
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

  routes(): Router.IMiddleware {
    return this.router.routes();
  }

}

export default BaseViewSet;
