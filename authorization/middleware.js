const config = require('../config');
const AuthorizationError = require('../errors/AuthorizationError');

// Instantiate all permission backends
const permissionBackends = config.PERMISSION_BACKENDS.map(backend => {
  const Backend = require(`../${backend}`);
  return new Backend();
});

// requirePermission middleware factory
function requirePermission(permissionName, options) {
  return async (ctx, next) => {
    for (let backend of permissionBackends) {
      let hasPermission = await backend.hasPermission(ctx, permissionName, options);
      if (hasPermission) {
        await next();
        return;
      }
    }
    throw new AuthorizationError();
  };
}

module.exports.requirePermission = requirePermission;
