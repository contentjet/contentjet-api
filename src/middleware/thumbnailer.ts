import * as Koa from 'koa';
import * as sharp from 'sharp';
import { get } from 'lodash';
import config from '../config';
import { IFile } from '../types';

export default async (ctx: Koa.Context, next: () => Promise<any>) => {
  const { file }: { file: IFile | undefined } = ctx.req as any;
  if (file && ['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype)) {
    // Get the dimensions of uploaded image
    const metadata = await sharp(file.buffer).metadata();
    file.width = get(metadata, 'width', 0);
    file.height = get(metadata, 'height', 0);
    // Create thumbnail
    if (config.THUMBNAIL_WIDTH > 0 && config.THUMBNAIL_HEIGHT > 0) {
      file.thumbnailBuffer = await sharp(file.buffer)
        .resize(config.THUMBNAIL_WIDTH, config.THUMBNAIL_HEIGHT)
        .max()
        .toBuffer();
    }
  }
  await next();
};
