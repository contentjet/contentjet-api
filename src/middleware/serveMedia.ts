import * as path from 'path';
import * as Koa from 'koa';
import * as send from 'koa-send';
import config from '../config';

export default async (ctx: Koa.Context, next: () => Promise<any>) => {
  if (ctx.path.match(/^\/media\/.*$/)) {
    await send(ctx, path.join(config.MEDIA_ROOT, ctx.path.replace('/media/', '')));
  } else {
    await next();
  }
};
