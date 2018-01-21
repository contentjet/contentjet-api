import * as Koa from 'koa';

export default interface IPermissionBackend {

  hasPermission(ctx: Koa.Context, permissionName: string, options?: any): Promise<boolean>;

}
