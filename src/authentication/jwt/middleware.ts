import User from '../../models/User';
import * as Koa from 'koa';
import AuthenticationError from '../../errors/AuthenticationError';
import {verifyAuthToken} from './utils';

export async function requireAuthentication(ctx: Koa.Context, next: Function): Promise<any> {
  if (!ctx.request.headers.authorization) throw new AuthenticationError('Authorization header is missing');
  if (!ctx.request.headers.authorization.startsWith('Bearer')) throw new AuthenticationError('Invalid authorization header');
  const accessToken = ctx.request.headers.authorization.replace('Bearer', '').replace(' ', '');
  const payload = await verifyAuthToken(accessToken);
  ctx.state.user = await User.getById(payload.userId);
  await next();
}
