const User = require('../../models/User');
const AuthenticationError = require('../../errors/AuthenticationError');
const ValidationError = require('../../errors/ValidationError');
const {generateAuthToken, refreshAuthToken} = require('./utils');
const validate = require('../../utils/validate');


const authenticationConstraints = {
  grant_type: {
    presence: true
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
    presence: true
  }
};

async function authenticate(ctx) {
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

async function tokenRefresh(ctx) {
  const errors = validate(ctx.request.body, tokenRefreshConstraints);
  if (errors) {
    const err = new ValidationError();
    err.errors = errors;
    throw err;
  }
  const {refresh_token} = ctx.request.body;
  ctx.body = await refreshAuthToken(refresh_token);
}

module.exports = {
  authenticate,
  tokenRefresh
};
