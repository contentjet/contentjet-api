import * as Koa from 'koa';
import EntryType from '../models/EntryType';
import BaseViewSet from './BaseViewSet';
import {requireAuthentication} from '../authentication/jwt/middleware';

export default class EntryTypeViewSet extends BaseViewSet<EntryType> {

  constructor(options: any) {
    super(EntryType, options);
  }

  getCommonMiddleware() {
    return [requireAuthentication];
  }

  getListQueryBuilder(ctx: Koa.Context) {
    return super
      .getListQueryBuilder(ctx)
      .where('projectId', ctx.state.project.id);
  }

  getRetrieveQueryBuilder(ctx: Koa.Context) {
    return super
      .getRetrieveQueryBuilder(ctx)
      .where('projectId', ctx.state.project.id);
  }

  async create(ctx: Koa.Context) {
    ctx.request.body.projectId = ctx.state.project.id;
    ctx.request.body.userId = ctx.state.user.id;
    return super.create(ctx);
  }

  async update(ctx: Koa.Context) {
    ctx.request.body.projectId = ctx.state.project.id;
    ctx.request.body.userId = ctx.state.user.id;
    return super.update(ctx);
  }

}
