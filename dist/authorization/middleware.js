"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const AuthorizationError_1 = require("../errors/AuthorizationError");
// requirePermission middleware factory
function requirePermission(permissionName) {
    return async function (ctx, next) {
        for (let backend of config_1.default.PERMISSION_BACKENDS) {
            const hasPermission = await backend.hasPermission(ctx, permissionName);
            if (hasPermission) {
                await next();
                return;
            }
        }
        throw new AuthorizationError_1.default();
    };
}
exports.requirePermission = requirePermission;
