import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';
import * as Koa from 'koa';
import * as send from 'koa-send';
// tslint:disable-next-line
const swaggerUIAbsolutePath = require('swagger-ui-dist').absolutePath();
import config from '../config';

export default () => {
  const swaggerIndex = fs
    .readFileSync(path.join(swaggerUIAbsolutePath, 'index.html'), { encoding: 'utf8' })
    .replace('https://petstore.swagger.io/v2/swagger.json', url.resolve(config.BACKEND_URL, 'spec'));

  return async (ctx: Koa.Context, next: () => Promise<any>) => {
    if (ctx.path.match(/^\/swagger\/.*$/)) {
      const _path = ctx.path.replace('/swagger/', '');
      if (_path === '' || _path === '/index.html') {
        ctx.body = swaggerIndex;
        return;
      }
      await send(ctx, _path, { root: swaggerUIAbsolutePath });
    } else {
      await next();
    }
  };
};
