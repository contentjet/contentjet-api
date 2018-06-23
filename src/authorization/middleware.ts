import config from '../config';
import * as Koa from 'koa';
import * as Router from 'koa-router';
import AuthorizationError from '../errors/AuthorizationError';

// requirePermission middleware factory
export function requirePermission(permissionName: string): Router.IMiddleware {
  return async (ctx: Koa.Context, next: () => Promise<any>): Promise<void> => {
    let hasPermission = false;
    // Check the permission against each backend until one returns true. If
    // no backends confirm the permission an AuthorizationError is thrown.
    for (const backend of config.PERMISSION_BACKENDS) {
      hasPermission = await backend.hasPermission(ctx, permissionName);
      if (hasPermission) break;
    }
    if (hasPermission) return await next();
    throw new AuthorizationError();
  };
}
