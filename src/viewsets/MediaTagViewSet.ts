import * as Koa from 'koa';
import MediaTag from '../models/MediaTag';
import BaseViewSet from './BaseViewSet';
import { requireAuthentication } from '../authentication/jwt/middleware';
import { cloneDeep } from 'lodash';

export default class MediaTagViewSet extends BaseViewSet<MediaTag> {

  constructor(options: any) {
    const clonedOptions = cloneDeep(options);
    clonedOptions.disabledActions = ['create', 'retrieve', 'delete', 'update'];
    super(MediaTag, clonedOptions);
  }

  getCommonMiddleware() {
    return [requireAuthentication];
  }

  getPageSize() {
    return 0;
  }

  getListQueryBuilder(ctx: Koa.Context) {
    return MediaTag.getInProject(ctx.state.project.id);
  }

  async list(ctx: Koa.Context) {
    const results = await super.list(ctx) as any[];
    const mediaTagList: MediaTag[] = results.map(mediaTag => mediaTag.name);
    ctx.body = mediaTagList;
    return mediaTagList;
  }

}
