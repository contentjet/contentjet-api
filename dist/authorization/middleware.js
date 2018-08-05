"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ModelPermissionBackend_1 = require("../backends/permissions/ModelPermissionBackend");
const ProjectPermissionBackend_1 = require("../backends/permissions/ProjectPermissionBackend");
const AuthorizationError_1 = require("../errors/AuthorizationError");
const permissionBackends = [
    new ModelPermissionBackend_1.default(),
    new ProjectPermissionBackend_1.default()
];
// requirePermission middleware factory
function requirePermission(permissionName) {
    return async (ctx, next) => {
        let hasPermission = false;
        // Check the permission against each backend until one returns true. If
        // no backends confirm the permission an AuthorizationError is thrown.
        for (const backend of permissionBackends) {
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
