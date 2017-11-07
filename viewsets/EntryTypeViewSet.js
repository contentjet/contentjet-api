const EntryType = require('../models/EntryType');
const BaseViewSet = require('./BaseViewSet');
const {requireAuthentication} = require('../authentication/jwt/middleware');

class EntryTypeViewSet extends BaseViewSet {

  constructor(options) {
    super(EntryType, options);
  }

  getCommonMiddleware() {
    return [requireAuthentication];
  }

  getListQueryBuilder(ctx) {
    return super.getListQueryBuilder()
      .where('projectId', ctx.state.project.id);
  }

  getRetrieveQueryBuilder(ctx) {
    return super.getRetrieveQueryBuilder()
      .where('projectId', ctx.state.project.id);
  }

  async create(ctx, next) {
    ctx.request.body.projectId = ctx.state.project.id;
    ctx.request.body.userId = ctx.state.user.id;
    return super.create(ctx, next);
  }

  async update(ctx, next) {
    ctx.request.body.projectId = ctx.state.project.id;
    ctx.request.body.userId = ctx.state.user.id;
    return super.update(ctx, next);
  }

}

module.exports = EntryTypeViewSet;
