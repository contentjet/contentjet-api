import * as Koa from 'koa';
import User from '../../models/User';
import Client from '../../models/Client';
import AuthenticationError from '../../errors/AuthenticationError';
import ValidationError from '../../errors/ValidationError';
import {generateUserAuthToken, generateClientAuthToken, refreshUserAuthToken} from './utils';
import validate from '../../utils/validate';


const passwordAuthenticationConstraints = {
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

const clientAuthenticationConstraints = {
  grant_type: {
    presence: true,
    format: {
      pattern: /^client_credentials$/,
      message: 'must be \'client_credentials\''
    }
  },
  client_id: {
    presence: true,
    length: {
      is: 32
    }
  },
  client_secret: {
    presence: true,
    length: {
      is: 32
    }
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

export async function authenticateUser(ctx: Koa.Context) {
  const errors = validate(ctx.request.body, passwordAuthenticationConstraints);
  if (errors) {
    const err = new ValidationError();
    err.errors = errors;
    throw err;
  }
  const { username, password } = ctx.request.body;
  const user = await User.authenticate(username, password);
  if (!user) throw new AuthenticationError('A user with the submitted credentials does not exist');
  if (!user.isActive) throw new AuthenticationError('User is marked inactive');
  ctx.state.user = user;
  ctx.body = await generateUserAuthToken({userId: ctx.state.user.id});
}

export async function authenticateClient(ctx: Koa.Context) {
  const errors = validate(ctx.request.body, clientAuthenticationConstraints);
  if (errors) {
    const err = new ValidationError();
    err.errors = errors;
    throw err;
  }
  const { client_id, client_secret } = ctx.request.body;
  const client = await Client.authenticate(client_id, client_secret);
  if (!client) throw new AuthenticationError('A client with the submitted credentials does not exist');
  ctx.state.client = client;
  // NOTE: clientId in the encoded token references Client.id NOT Client.clientId.
  // The aud field contains Client.clientId.
  ctx.body = await generateClientAuthToken({
    clientId: ctx.state.client.id,
    aud: ctx.state.client.clientId
  });
}

export async function tokenRefresh(ctx: Koa.Context) {
  const errors = validate(ctx.request.body, tokenRefreshConstraints);
  if (errors) {
    const err = new ValidationError();
    err.errors = errors;
    throw err;
  }
  const { refresh_token } = ctx.request.body;
  ctx.body = await refreshUserAuthToken(refresh_token);
}
