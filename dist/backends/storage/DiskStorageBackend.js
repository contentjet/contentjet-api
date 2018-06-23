"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const mkdirp = require("mkdirp");
const multer = require('koa-multer');
class DiskStorageBackend {
    constructor(mediaRoot) {
        this.mediaRoot = mediaRoot;
        this.middleware = this.middleware.bind(this);
        this.getRelativePath = this.getRelativePath.bind(this);
    }
    async middleware(ctx, next) {
        // Each uploaded file goes into a directory matching it's project id
        // e.g <destination>/<projectId>/<year>-<month>/
        const now = new Date();
        const dir = path.resolve(path.join(this.mediaRoot, String(ctx.state.project.id), `${now.getFullYear()}-${now.getMonth() + 1}`));
        const storage = multer.diskStorage({
            destination(_req, _file, cb) {
                // Always create path on filesystem if it doesn't exist
                mkdirp(dir, (err) => {
                    if (err)
                        cb(err);
                    cb(null, dir);
                });
            },
            filename(_req, file, cb) {
                cb(null, `${Date.now()}-${Math.floor(Math.random() * 1000000)}${path.extname(file.originalname)}`);
            }
        });
        const upload = multer({ storage });
        await upload.single('file')(ctx, next);
    }
    getRelativePath(path_) {
        return path.relative(this.mediaRoot, path_);
    }
}
exports.default = DiskStorageBackend;
