import * as Koa from 'koa';

export default interface IStorageBackend {
  middleware(ctx: Koa.Context, next: () => Promise<any>): void;
  getRelativePath(path: string): string;
}
