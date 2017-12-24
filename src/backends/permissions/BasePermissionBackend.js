class BasePermissionBackend {

  async hasPermission(ctx, permissionName, options) {
    throw new Error('Abstract method must be extended by sub class');
  }

}

module.exports = BasePermissionBackend;
