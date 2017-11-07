const MediaTag = require('../models/MediaTag');
const BaseViewSet = require('./BaseViewSet');
const {requireAuthentication} = require('../authentication/jwt/middleware');
const _ = require('lodash');

class MediaTagViewSet extends BaseViewSet {

  constructor(options) {
    const clonedOptions = _.cloneDeep(options);
    clonedOptions.disabledActions = ['create', 'retrieve', 'delete', 'update'];
    super(MediaTag, clonedOptions);
  }

  getCommonMiddleware() {
    return [requireAuthentication];
  }

  getPageSize() {
    return 0;
  }

  getListQueryBuilder(ctx) {
    return MediaTag.getInProject(ctx.state.project.id);
  }

  async list(ctx, next) {
    let results = await super.list(ctx, next);
    results = results.map(mediaTag => mediaTag.name);
    ctx.body = results;
  }

}

module.exports = MediaTagViewSet;
