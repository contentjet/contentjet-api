import IPermissionBackend from './IPermissionBackend';
import * as Koa from 'koa';

export default class ModelPermissionBackend implements IPermissionBackend {

  async hasPermission(ctx: Koa.Context, permissionName: string): Promise<boolean> {
    const { user } = ctx.state;
    if (!user) return false;
    if (user.isAdmin) return true;
    return await user.hasPermission(permissionName);
  }

}
