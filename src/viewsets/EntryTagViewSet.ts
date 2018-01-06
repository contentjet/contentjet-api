import * as Koa from 'koa';
import EntryTag from '../models/EntryTag';
import BaseViewSet from './BaseViewSet';
import {requireAuthentication} from '../authentication/jwt/middleware';
import {cloneDeep} from 'lodash';

export default class EntryTagViewSet extends BaseViewSet<EntryTag> {

  constructor(options: any) {
    const clonedOptions = cloneDeep(options);
    clonedOptions.disabledActions = ['create', 'retrieve', 'delete', 'update'];
    super(EntryTag, clonedOptions);
  }

  getCommonMiddleware() {
    return [requireAuthentication];
  }

  getPageSize() {
    return 0;
  }

  getListQueryBuilder(ctx: Koa.Context) {
    return EntryTag.getInProject(ctx.state.project.id);
  }

  async list(ctx: Koa.Context) {
    const results = await super.list(ctx) as EntryTag[];
    const entryTagList = results.map(entryTag => entryTag.name);
    ctx.body = entryTagList;
    return results;
  }

}
