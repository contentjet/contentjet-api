"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ModelPermissionBackend {
    async hasPermission(ctx, permissionName) {
        const { user } = ctx.state;
        if (!user)
            return false;
        if (user.isAdmin)
            return true;
        return await user.hasPermission(permissionName);
    }
}
exports.default = ModelPermissionBackend;
