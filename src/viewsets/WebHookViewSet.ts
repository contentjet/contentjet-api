import * as Koa from 'koa';
import WebHook from '../models/WebHook';
import BaseViewSet from './BaseViewSet';
import {requireAuthentication} from '../authentication/jwt/middleware';

export default class WebHookViewSet extends BaseViewSet<WebHook> {

  constructor(options: any) {
    super(WebHook, options);
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

  getPageSize() {
    return 0;
  }

  async create(ctx: Koa.Context) {
    ctx.request.body.projectId = ctx.state.project.id;
    return super.create(ctx);
  }

  async update(ctx: Koa.Context) {
    ctx.request.body.projectId = ctx.state.project.id;
    return super.update(ctx);
  }

}
