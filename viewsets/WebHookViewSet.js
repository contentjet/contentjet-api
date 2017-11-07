const WebHook = require('../models/WebHook');
const BaseViewSet = require('./BaseViewSet');
const {requireAuthentication} = require('../authentication/jwt/middleware');

class WebHookViewSet extends BaseViewSet {

  constructor(options) {
    super(WebHook, options);
  }

  getCommonMiddleware() {
    return [requireAuthentication];
  }

  getListQueryBuilder(ctx) {
    return super.getListQueryBuilder(ctx)
      .where('projectId', ctx.state.project.id);
  }

  getRetrieveQueryBuilder(ctx) {
    return super.getRetrieveQueryBuilder(ctx)
      .where('projectId', ctx.state.project.id);
  }

  async create(ctx, next) {
    ctx.request.body.projectId = ctx.state.project.id;
    return super.create(ctx, next);
  }

  async update(ctx, next) {
    ctx.request.body.projectId = ctx.state.project.id;
    return super.update(ctx, next);
  }

}

module.exports = WebHookViewSet;
