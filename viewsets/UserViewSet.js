const fs = require('fs');
const path = require('path');
const url = require('url');
const ejs = require('ejs');
const _ = require('lodash');
const { mjml2html } = require('mjml');
const transaction = require('objection').transaction;
const User = require('../models/User');
const Project = require('../models/Project');
const ProjectInvite = require('../models/ProjectInvite');
const BaseViewSet = require('./BaseViewSet');
const ValidationError = require('../errors/ValidationError');
const config = require('../config');
const {authenticate, tokenRefresh} = require('../authentication/jwt/routes');
const {requireAuthentication} = require('../authentication/jwt/middleware');
const validate = require('../utils/validate');

const signUpHTML = mjml2html(
  fs.readFileSync(
    path.resolve(__dirname, '../templates/mail/sign-up-verify.mjml'), 'utf8'
  )
).html;
const signUpTXT = fs.readFileSync(
  path.resolve(__dirname, '../templates/mail/sign-up-verify.txt'), 'utf8'
);
const requestPasswordResetHTML = mjml2html(
  fs.readFileSync(
    path.resolve(__dirname, '../templates/mail/request-password-reset.mjml'), 'utf8'
  )
).html;
const requestPasswordResetTXT = fs.readFileSync(
  path.resolve(__dirname, '../templates/mail/request-password-reset.txt'), 'utf8'
);

const signUpConstraints = {
  email: {
    presence: true,
    email: true
  },
  name: {
    presence: true,
    length: {
      minimum: 1,
      maximum: 128
    }
  },
  password: {
    presence: true,
    length: {
      minimum: 6,
      maximum: 64
    }
  },
  inviteToken: {
    presence: true
  }
};

const updateMeConstraints = {
  name: {
    presence: true,
    length: {
      minimum: 1,
      maximum: 128
    }
  }
};

const setPasswordConstraints = {
  token: {
    presence: true
  },
  password: {
    presence: true,
    length: {
      minimum: 6,
      maximum: 64
    }
  }
};

const requestPasswordResetConstraints = {
  email: {
    presence: true,
    email: true
  }
};

class UserViewSet extends BaseViewSet {

  constructor(options) {
    const clonedOptions = _.cloneDeep(options);
    clonedOptions.disabledActions = ['create', 'delete', 'update'];
    super(User, clonedOptions);
    this.retrieveMe = this.retrieveMe.bind(this);
    this.updateMe = this.updateMe.bind(this);
    this.signUp = this.signUp.bind(this);
    this.verify = this.verify.bind(this);
    this.setPassword = this.setPassword.bind(this);
    this.requestPasswordReset = this.requestPasswordReset.bind(this);
    this.router.get('me', requireAuthentication, this.retrieveMe);
    this.router.put('me', requireAuthentication, this.updateMe);
    this.router.post('sign-up', this.signUp);
    this.router.post('verify', this.verify);
    this.router.post('request-password-reset', this.requestPasswordReset);
    this.router.post('set-password', this.setPassword);
    this.router.post('authenticate', authenticate);
    this.router.post('token-refresh', requireAuthentication, tokenRefresh);
  }

  getListMiddleware() {
    return [requireAuthentication].concat(super.getListMiddleware());
  }

  getCreateMiddleware() {
    return [requireAuthentication].concat(super.getCreateMiddleware());
  }

  getRetrieveMiddleware() {
    return [requireAuthentication].concat(super.getRetrieveMiddleware());
  }

  getUpdateMiddleware() {
    return [requireAuthentication].concat(super.getUpdateMiddleware());
  }

  getDeleteMiddleware() {
    return [requireAuthentication].concat(super.getDeleteMiddleware());
  }

  retrieveMe(ctx, next) {
    ctx.body = ctx.state.user;
  }

  async updateMe(ctx, next) {
    const errors = validate(ctx.request.body, updateMeConstraints);
    if (errors) {
      const err = new ValidationError();
      err.errors = errors;
      throw err;
    }
    let {user} = ctx.state;
    const {name} = ctx.request.body;
    if (name) {
      user = await user
        .$query()
        .patch({ name })
        .returning('*')
        .first();
    }
    ctx.body = user;
  }

  async signUp(ctx, next) {
    const errors = validate(ctx.request.body, signUpConstraints);
    if (errors) {
      const err = new ValidationError();
      err.errors = errors;
      throw err;
    }
    const {email, name, password, inviteToken} = ctx.request.body;
    try {
      var invitePayload = await ProjectInvite.verifyInviteToken(inviteToken);
    } catch (err) {
      throw new ValidationError('Invalid invite token');
    }
    const knex = ProjectInvite.knex();
    await transaction(knex, async (trx) => {
      const user = await User.create(
        email, name, password, config.ACTIVE_ON_SIGNUP, trx
      );
      // Get the project from the invite...
      const {projectId, projectInviteId} = invitePayload;
      const project = await Project.getById(projectId, trx);
      // ... mark the invite as accepted...
      await ProjectInvite.accept(projectInviteId, trx);
      // ... and make the user a member of the project.
      await project.addUser(user, 'author', trx);
      // Send verification email
      if (!config.ACTIVE_ON_SIGNUP) {
        let token = await User.generateSignUpToken(user.id);
        token = token.replace(/\./g, '~');
        const context = {
          url: url.resolve(config.FRONTEND_URL, `/sign-up/verify/${token}`),
          name
        };
        const mailOptions = {
          from: config.MAIL_FROM,
          to: email,
          subject: 'Please verify your email address',
          text: ejs.render(signUpTXT, context),
          html: ejs.render(signUpHTML, context)
        };
        ctx.sendMail(mailOptions, (err, info) => {
          if (err) return console.log(err);
          console.log('Message sent: %s', info.messageId);
        });
      }
      ctx.status = 201;
      ctx.body = user;
    });
  }

  async verify(ctx, next) {
    const {token} = ctx.request.body;
    if (!token) throw new ValidationError('Verification token is required');
    const {userId} = await User.verifySignUpToken(token);
    const user = await User
      .query()
      .patch({ isActive: true })
      .where('id', userId)
      .returning('*')
      .first();
    ctx.body = user;
  }

  async requestPasswordReset(ctx, next) {
    const errors = validate(ctx.request.body, requestPasswordResetConstraints);
    if (errors) {
      const err = new ValidationError();
      err.errors = errors;
      throw err;
    }
    const {email} = ctx.request.body;
    const user = await User
      .query()
      .where('email', email)
      .first();
    if (!user) throw new ValidationError('A user matching this email address does not exist');
    let token = await User.generatePasswordResetToken(user.id);
    token = token.replace(/\./g, '~');
    const context = {
      url: url.resolve(config.FRONTEND_URL, `/change-password/${token}`),
      name: user.name
    };
    const mailOptions = {
      from: config.MAIL_FROM,
      to: email,
      subject: 'Password reset request',
      text: ejs.render(requestPasswordResetTXT, context),
      html: ejs.render(requestPasswordResetHTML, context)
    };
    ctx.sendMail(mailOptions, (err, info) => {
      if (err) return console.log(err);
      console.log('Message sent: %s', info.messageId);
    });
    ctx.body = user;
  }

  async setPassword(ctx, next) {
    const errors = validate(ctx.request.body, setPasswordConstraints);
    if (errors) {
      const err = new ValidationError();
      err.errors = errors;
      throw err;
    }
    const {token, password} = ctx.request.body;
    const {userId} = await User.verifyPasswordResetToken(token);
    const user = await User.setPassword(userId, password);
    ctx.body = user;
  }

}

module.exports = UserViewSet;
