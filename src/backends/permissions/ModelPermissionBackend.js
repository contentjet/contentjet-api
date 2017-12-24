const BasePermissionBackend = require('./BasePermissionBackend');


class ModelPermissionBackend extends BasePermissionBackend {

  async hasPermission(ctx, permissionName, options) {
    const {user} = ctx.state;
    if (!user) return false;
    if (user.isAdmin) return true;
    return await user.hasPermission(permissionName);
  }

}

module.exports = ModelPermissionBackend;
