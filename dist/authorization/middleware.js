"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const AuthorizationError_1 = require("../errors/AuthorizationError");
// requirePermission middleware factory
function requirePermission(permissionName) {
    return async (ctx, next) => {
        let hasPermission = false;
        // Check the permission against each backend until one returns true. If
        // no backends confirm the permission an AuthorizationError is thrown.
        for (const backend of config_1.default.PERMISSION_BACKENDS) {
            hasPermission = await backend.hasPermission(ctx, permissionName);
            if (hasPermission)
                break;
        }
        if (hasPermission)
            return await next();
        throw new AuthorizationError_1.default();
    };
}
exports.requirePermission = requirePermission;
