import IPermissionBackend from './IPermissionBackend';
import * as Koa from 'koa';


export default class ProjectPermissionBackend implements IPermissionBackend {

  async hasPermission(ctx: Koa.Context, permissionName: string): Promise<boolean> {
    const {user, project} = ctx.state;
    if (!user) return false;
    if (permissionName === 'project:list') return true;
    if (permissionName === 'project:create' && !user.isAdmin) return false;
    if (!project) return false;
    if (user.isAdmin) return true;
    if (!(await project.isActiveMember(user.id))) return false;
    switch (permissionName) {
      case 'project:delete':
        return false;
      case 'project:update':
      case 'entryType:create':
      case 'entryType:update':
      case 'entryType:delete':
      case 'projectInvite:create':
      case 'projectInvite:update':
      case 'projectInvite:list':
      case 'projectInvite:retrieve':
      case 'projectInvite:delete':
      case 'webHook:create':
      case 'webHook:update':
      case 'webHook:list':
      case 'webHook:retrieve':
      case 'webHook:delete':
        return await project.isActiveMember(user.id, 'admin');
      default:
        return true;
    }
  }
}
