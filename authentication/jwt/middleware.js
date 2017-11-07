const User = require('../../models/User');
const AuthenticationError = require('../../errors/AuthenticationError');
const {verifyAuthToken} = require('./utils');

async function requireAuthentication(ctx, next) {
  if (!ctx.request.headers.authorization) throw new AuthenticationError('Authorization header is missing');
  if (!ctx.request.headers.authorization.startsWith('Bearer')) throw new AuthenticationError('Invalid authorization header');
  const accessToken = ctx.request.headers.authorization.replace('Bearer', '').replace(' ', '');
  const payload = await verifyAuthToken(accessToken);
  ctx.state.user = await User.getById(payload.userId);
  await next();
}

module.exports = {
  requireAuthentication
};
