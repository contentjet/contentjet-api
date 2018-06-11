import * as Koa from 'koa';
import User from '../../models/User';
import Client from '../../models/Client';
import AuthenticationError from '../../errors/AuthenticationError';
import { verifyAuthToken } from './utils';

export async function requireAuthentication(ctx: Koa.Context, next: Function): Promise<any> {
  if (!ctx.request.headers.authorization) throw new AuthenticationError('Authorization header is missing');
  if (!ctx.request.headers.authorization.startsWith('Bearer')) throw new AuthenticationError('Invalid authorization header');
  const accessToken = ctx.request.headers.authorization.replace('Bearer', '').replace(' ', '');
  const payload = await verifyAuthToken(accessToken);
  if (payload.userId) {
    ctx.state.user = await User.getById(payload.userId);
  } else if (payload.clientId) {
    ctx.state.client = await Client.getById(payload.clientId);
  }
  await next();
}
