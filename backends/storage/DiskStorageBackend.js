const path = require('path');
const mkdirp = require('mkdirp');
const BaseStorageBackend = require('./BaseStorageBackend');
const multer = require('koa-multer');
const config = require('../../config');

class DiskStorageBackend extends BaseStorageBackend {

  async middleware(ctx, next) {
    // Each uploaded file goes into a directory matching it's project id
    // e.g <destination>/<projectId>/<year>-<month>/
    const now = new Date();
    const dir = path.resolve(
      path.join(
        config.MEDIA_ROOT,
        String(ctx.state.project.id),
        `${now.getFullYear()}-${now.getMonth() + 1}`
      )
    );
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        // Always create path on filesystem if it doesn't exist
        mkdirp(dir, function (err) {
          if (err) cb(err);
          cb(null, dir);
        });
      },
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${parseInt(Math.random() * 1000000)}${path.extname(file.originalname)}`);
      }
    });
    const upload = multer({ storage });
    await upload.single('file')(ctx, next);
  }

  getRelativePath(_path) {
    return path.relative(config.MEDIA_ROOT, _path);
  }

}

module.exports = DiskStorageBackend;
