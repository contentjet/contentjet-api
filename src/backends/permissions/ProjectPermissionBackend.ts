import { IPermissionBackend } from '../../types';
import * as Koa from 'koa';

import User from '../../models/User';
import Project from '../../models/Project';
import Client from '../../models/Client';

const READ_ACTIONS = ['list', 'retrieve'];

export default class ProjectPermissionBackend implements IPermissionBackend {

  async userHasPermission(user: User, project: Project, permissionName: string): Promise<boolean> {
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
      case 'client:create':
      case 'client:update':
      case 'client:list':
      case 'client:retrieve':
      case 'client:delete':
        return await project.isActiveMember(user.id, 'admin');
      default:
        return true;
    }
  }

  async clientHasPermission(client: Client, project: Project, permissionName: string): Promise<boolean> {
    if (!project) return false;
    if (client.projectId !== project.id) return false;
    const action = permissionName.split(':')[1];
    if (!READ_ACTIONS.includes(action)) return false;
    return true;
  }

  async hasPermission(ctx: Koa.Context, permissionName: string): Promise<boolean> {
    const { user, client, project } = ctx.state;
    if (user) return this.userHasPermission(user, project, permissionName);
    if (client) return this.clientHasPermission(client, project, permissionName);
    return false;
  }
}
