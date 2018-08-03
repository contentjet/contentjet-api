import * as Koa from 'koa';
import * as multer from 'koa-multer';

export default async (ctx: Koa.Context, next: () => Promise<any>) => {
  const upload = multer({ storage: multer.memoryStorage() });
  await upload.single('file')(ctx, next);
};
