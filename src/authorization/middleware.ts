import config from '../config';
import * as Koa from 'koa';
import * as Router from 'koa-router';
import AuthorizationError from '../errors/AuthorizationError';


// requirePermission middleware factory
export function requirePermission(permissionName: string): Router.IMiddleware {
  return async function (ctx: Koa.Context, next: Function): Promise<void> {
    for (let backend of config.PERMISSION_BACKENDS) {
      const hasPermission = await backend.hasPermission(ctx, permissionName);
      if (hasPermission) {
        await next();
        return;
      }
    }
    throw new AuthorizationError();
  };
}
