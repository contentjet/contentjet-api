class BaseStorageBackend {

  async middleware(ctx, next) {
    await next();
  }

  getRelativePath(_path) {
    return _path;
  }

}

module.exports = BaseStorageBackend;
