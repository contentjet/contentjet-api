import * as Koa from 'koa';
import User from '../../models/User';
import AuthenticationError from '../../errors/AuthenticationError';
import ValidationError from '../../errors/ValidationError';
import {generateAuthToken, refreshAuthToken} from './utils';
import validate from '../../utils/validate';


const authenticationConstraints = {
  grant_type: {
    presence: true,
    format: {
      pattern: /^password$/,
      message: 'must be \'password\''
    }
  },
  username: {
    presence: true
  },
  password: {
    presence: true
  }
};

const tokenRefreshConstraints = {
  refresh_token: {
    presence: true
  },
  grant_type: {
    presence: true,
    format: {
      pattern: /^refresh_token$/,
      message: 'must be \'refresh_token\''
    }
  }
};

export async function authenticate(ctx: Koa.Context) {
  const errors = validate(ctx.request.body, authenticationConstraints);
  if (errors) {
    const err = new ValidationError();
    err.errors = errors;
    throw err;
  }
  const {username, password} = ctx.request.body;
  const user = await User.authenticate(username, password);
  if (!user) throw new AuthenticationError('A user with the submitted credentials does not exist');
  if (!user.isActive) throw new AuthenticationError('User is marked inactive');
  ctx.state.user = user;
  ctx.body = await generateAuthToken({userId: ctx.state.user.id});
}

export async function tokenRefresh(ctx: Koa.Context) {
  const errors = validate(ctx.request.body, tokenRefreshConstraints);
  if (errors) {
    const err = new ValidationError();
    err.errors = errors;
    throw err;
  }
  const {refresh_token} = ctx.request.body;
  ctx.body = await refreshAuthToken(refresh_token);
}
