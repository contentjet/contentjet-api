const config = require('../config');
import * as Koa from 'koa';
import AuthorizationError from '../errors/AuthorizationError';

// Instantiate all permission backends
const permissionBackends = config.PERMISSION_BACKENDS.map((backend: string) => {
  const Backend = require(`../${backend}`).default;
  return new Backend();
});

// requirePermission middleware factory
export function requirePermission(permissionName: string) {
  return async (ctx: Koa.Context, next: Function) => {
    for (let backend of permissionBackends) {
      const hasPermission = await backend.hasPermission(ctx, permissionName);
      if (hasPermission) {
        await next();
        return;
      }
    }
    throw new AuthorizationError();
  };
}
