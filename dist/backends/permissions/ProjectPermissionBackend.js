"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ProjectPermissionBackend {
    async hasPermission(ctx, permissionName) {
        const { user, project } = ctx.state;
        if (!user)
            return false;
        if (['project:list', 'project:create'].includes(permissionName))
            return true;
        if (!project)
            return false;
        if (user.isAdmin)
            return true;
        if (!(await project.isActiveMember(user)))
            return false;
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
                return await project.isActiveMember(user, 'admin');
            default:
                return true;
        }
    }
}
exports.default = ProjectPermissionBackend;
