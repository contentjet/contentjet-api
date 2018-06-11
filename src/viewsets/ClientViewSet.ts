import * as Koa from 'koa';
import * as Router from 'koa-router';
import Client from '../models/Client';
import BaseViewSet from './BaseViewSet';
import { requireAuthentication } from '../authentication/jwt/middleware';
import { authenticateClient } from '../authentication/jwt/routes';
import { cloneDeep } from 'lodash';

export default class ClientViewSet extends BaseViewSet<Client> {

  constructor(options: any) {
    const clonedOptions = cloneDeep(options);
    clonedOptions.disabledActions = ['update'];
    super(Client, options);
    this.router.post('authenticate', authenticateClient);
  }

  getPageSize(_ctx: Koa.Context): number {
    return 0;
  }

  getListMiddleware() {
    const middleware: Array<Router.IMiddleware> = [requireAuthentication];
    return middleware.concat(super.getListMiddleware());
  }

  getCreateMiddleware() {
    const middleware: Array<Router.IMiddleware> = [requireAuthentication];
    return middleware.concat(super.getCreateMiddleware());
  }

  getRetrieveMiddleware() {
    const middleware: Array<Router.IMiddleware> = [requireAuthentication];
    return middleware.concat(super.getRetrieveMiddleware());
  }

  getDeleteMiddleware() {
    const middleware: Array<Router.IMiddleware> = [requireAuthentication];
    return middleware.concat(super.getDeleteMiddleware());
  }

  getListQueryBuilder(ctx: Koa.Context) {
    return super
      .getListQueryBuilder(ctx)
      .where('client.projectId', ctx.state.project.id)
      .orderBy('client.modifiedAt', 'desc');
  }

  getRetrieveQueryBuilder(ctx: Koa.Context) {
    return super
      .getRetrieveQueryBuilder(ctx)
      .where('projectId', ctx.state.project.id);
  }

  async create(ctx: Koa.Context) {
    ctx.request.body.projectId = ctx.state.project.id;
    ctx.request.body.clientId = Client.generateRandomString();
    ctx.request.body.clientSecret = Client.generateRandomString();
    return super.create(ctx);
  }

}
