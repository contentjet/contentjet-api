import * as Koa from 'koa';

export default interface IStorageBackend {
  middleware(ctx: Koa.Context, next: Function): void;
  getRelativePath(path: string): string;
}
