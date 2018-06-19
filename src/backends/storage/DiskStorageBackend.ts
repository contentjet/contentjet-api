import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as Koa from 'koa';
import IStorageBackend from './IStorageBackend';
const multer = require('koa-multer');

export default class DiskStorageBackend implements IStorageBackend {

  mediaRoot: string;

  constructor(mediaRoot: string) {
    this.mediaRoot = mediaRoot;
    this.middleware = this.middleware.bind(this);
    this.getRelativePath = this.getRelativePath.bind(this);
  }

  async middleware(ctx: Koa.Context, next: () => Promise<any>) {
    // Each uploaded file goes into a directory matching it's project id
    // e.g <destination>/<projectId>/<year>-<month>/
    const now = new Date();
    const dir = path.resolve(
      path.join(
        this.mediaRoot,
        String(ctx.state.project.id),
        `${now.getFullYear()}-${now.getMonth() + 1}`
      )
    );
    const storage = multer.diskStorage({
      destination(_req: any, _file: any, cb: Function) {
        // Always create path on filesystem if it doesn't exist
        mkdirp(dir, (err: any) => {
          if (err) cb(err);
          cb(null, dir);
        });
      },
      filename(_req: any, file: any, cb: Function) {
        cb(null, `${Date.now()}-${Math.floor(Math.random() * 1000000)}${path.extname(file.originalname)}`);
      }
    });
    const upload = multer({ storage });
    await upload.single('file')(ctx, next);
  }

  getRelativePath(path_: string): string {
    return path.relative(this.mediaRoot, path_);
  }

}
