import * as Koa from 'koa';
import * as Router from 'koa-router';
import { pick } from 'lodash';
import { ModelClass, QueryBuilder } from 'objection';
import * as moment from 'moment';
import NotFoundError from '../errors/NotFoundError';
import DatabaseError from '../errors/DatabaseError';
import { requirePermission } from '../authorization/middleware';
import IStorageBackend from '../backends/storage/IStorageBackend';


interface IViewSetOptions {
  disabledActions?: ReadonlyArray<string>;
  storage: IStorageBackend;
}

export interface IPaginatedResult {
    page: number;
    totalPages: number;
    totalRecords: number;
    results: any[];
}

export default abstract class BaseViewSet<MC> {

  Model: ModelClass<any>;
  options: IViewSetOptions;
  router: Router;

  constructor(M: ModelClass<any>, options: IViewSetOptions) {
    this.Model = M;
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

  getIdRouteParameter(): string {
    return `${this.Model.tableName}Id`;
  }

  getRouterOptions(): Router.IRouterOptions | undefined {
    return undefined;
  }

  getCommonMiddleware(): Router.IMiddleware[] {
    return [];
  }

  getPageSize(_ctx: Koa.Context): number {
    return 30;
  }

  getListQueryBuilder(_ctx: Koa.Context): QueryBuilder<MC> {
    return this.Model.query();
  }

  getRetrieveQueryBuilder(_ctx: Koa.Context): QueryBuilder<MC> {
    return this.Model.query();
  }

  getCreateQueryBuilder(_ctx: Koa.Context): QueryBuilder<MC> {
    return this.Model.query();
  }

  getUpdateQueryBuilder(_ctx: Koa.Context): QueryBuilder<MC> {
    return this.Model.query();
  }

  getDeleteQueryBuilder(_ctx: Koa.Context): QueryBuilder<MC> {
    return this.Model.query();
  }

  getListMiddleware(): Router.IMiddleware[] {
    return [requirePermission(`${this.Model.tableName}:list`)];
  }

  getColumnNames(): string[] {
    return Object.keys(this.Model.jsonSchema.properties as any);
  }

  async list(ctx: Koa.Context): Promise<IPaginatedResult | MC[]> {
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
      } as IPaginatedResult;
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

  async create(ctx: Koa.Context): Promise<MC> {
    const data = pick(ctx.request.body, this.getColumnNames()) as any;
    const model = await this.getCreateQueryBuilder(ctx)
      .insert(data)
      .returning('*')
      .first();
    if (!model) throw new DatabaseError();
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

  async retrieve(ctx: Koa.Context): Promise<MC> {
    const id = ctx.params[this.getIdRouteParameter()];
    const model = await this
      .getRetrieveQueryBuilder(ctx)
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
    const data = pick(ctx.request.body, this.getColumnNames()) as any;
    delete data['createdAt'];
    data.id = parseInt(id);
    data.modifiedAt = moment().format();
    const model = await this.getUpdateQueryBuilder(ctx)
      .update(data)
      .returning('*')
      .where(`${this.Model.tableName}.id`, id)
      .first();
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
      .where(`${this.Model.tableName}.id`, id)
      .delete();
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
