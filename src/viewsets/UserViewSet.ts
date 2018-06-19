import * as Koa from 'koa';
import * as Router from 'koa-router';
import fs = require('fs');
import path = require('path');
import url = require('url');
import * as ejs from 'ejs';
import { cloneDeep } from 'lodash';
const { mjml2html } = require('mjml'); // tslint:disable-line
import { transaction } from 'objection';
import User from '../models/User';
import Project from '../models/Project';
import ProjectInvite, { IInvitePayload } from '../models/ProjectInvite';
import BaseViewSet from './BaseViewSet';
import ValidationError from '../errors/ValidationError';
import NotFoundError from '../errors/NotFoundError';
import config from '../config';
import { requireAuthentication } from '../authentication/jwt/middleware';
import validate from '../utils/validate';

const sendMail = config.MAIL_BACKEND.sendMail;

const signUpHTML = mjml2html(
  fs.readFileSync(
    path.resolve(__dirname, '../../templates/mail/sign-up-verify.mjml'), 'utf8'
  )
).html;
const signUpTXT = fs.readFileSync(
  path.resolve(__dirname, '../../templates/mail/sign-up-verify.txt'), 'utf8'
);
const requestPasswordResetHTML = mjml2html(
  fs.readFileSync(
    path.resolve(__dirname, '../../templates/mail/request-password-reset.mjml'), 'utf8'
  )
).html;
const requestPasswordResetTXT = fs.readFileSync(
  path.resolve(__dirname, '../../templates/mail/request-password-reset.txt'), 'utf8'
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

const changePasswordConstraints = {
  password: {
    presence: true,
    length: {
      minimum: 6,
      maximum: 64
    }
  },
  newPassword: {
    presence: true,
    length: {
      minimum: 6,
      maximum: 64
    }
  }
};

export default class UserViewSet extends BaseViewSet<User> {

  constructor(options: any) {
    const clonedOptions = cloneDeep(options);
    clonedOptions.disabledActions = ['create', 'delete', 'update'];
    super(User, clonedOptions);
    this.retrieveMe = this.retrieveMe.bind(this);
    this.updateMe = this.updateMe.bind(this);
    this.signUp = this.signUp.bind(this);
    this.verify = this.verify.bind(this);
    this.setPassword = this.setPassword.bind(this);
    this.requestPasswordReset = this.requestPasswordReset.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.router.get('me', requireAuthentication, this.retrieveMe);
    this.router.put('me', requireAuthentication, this.updateMe);
    this.router.post('sign-up', this.signUp);
    this.router.post('verify', this.verify);
    this.router.post('request-password-reset', this.requestPasswordReset);
    this.router.post('set-password', this.setPassword);
    this.router.post('change-password', requireAuthentication, this.changePassword);
  }

  getListMiddleware() {
    const middleware: Router.IMiddleware[] = [requireAuthentication];
    return middleware.concat(super.getListMiddleware());
  }

  getCreateMiddleware() {
    const middleware: Router.IMiddleware[] = [requireAuthentication];
    return middleware.concat(super.getCreateMiddleware());
  }

  getRetrieveMiddleware() {
    const middleware: Router.IMiddleware[] = [requireAuthentication];
    return middleware.concat(super.getRetrieveMiddleware());
  }

  getUpdateMiddleware() {
    const middleware: Router.IMiddleware[] = [requireAuthentication];
    return middleware.concat(super.getUpdateMiddleware());
  }

  getDeleteMiddleware() {
    const middleware: Router.IMiddleware[] = [requireAuthentication];
    return middleware.concat(super.getDeleteMiddleware());
  }

  retrieveMe(ctx: Koa.Context) {
    ctx.body = ctx.state.user;
  }

  async updateMe(ctx: Koa.Context) {
    const errors = validate(ctx.request.body, updateMeConstraints);
    if (errors) {
      const err = new ValidationError();
      err.errors = errors;
      throw err;
    }
    let { user } = ctx.state;
    const { name } = ctx.request.body;
    if (name) {
      user = await user
        .$query()
        .patch({ name })
        .returning('*')
        .first();
    }
    ctx.body = user;
  }

  async signUp(ctx: Koa.Context) {
    const errors = validate(ctx.request.body, signUpConstraints);
    if (errors) {
      const err = new ValidationError();
      err.errors = errors;
      throw err;
    }
    const { email, name, password, inviteToken } = ctx.request.body;
    let invitePayload: IInvitePayload;
    try {
      invitePayload = await ProjectInvite.verifyInviteToken(inviteToken);
    } catch (err) {
      throw new ValidationError('Invalid invite token');
    }
    const knex = ProjectInvite.knex();
    await transaction(knex, async trx => {
      const user = await User.create(
        email, name, password, config.ACTIVE_ON_SIGNUP, false, trx
      );
      // Get the project from the invite...
      const { projectId, projectInviteId } = invitePayload;
      const project = await Project.getById(projectId, trx);
      if (!project) throw new NotFoundError('Project does not exist');
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
        sendMail(mailOptions)
          .then(info => {
            console.log('Message sent: %s', info.messageId); // tslint:disable-line
          })
          .catch(err => {
            console.error(err);
          });
      }
      ctx.status = 201;
      ctx.body = user;
    });
  }

  async verify(ctx: Koa.Context) {
    const { token } = ctx.request.body;
    if (!token) throw new ValidationError('Verification token is required');
    const { userId } = await User.verifySignUpToken(token);
    const user = await User
      .query()
      .patch({ isActive: true })
      .returning('*')
      .where('id', userId)
      .first();
    ctx.body = user;
  }

  async requestPasswordReset(ctx: Koa.Context) {
    const errors = validate(ctx.request.body, requestPasswordResetConstraints);
    if (errors) {
      const err = new ValidationError();
      err.errors = errors;
      throw err;
    }
    const { email } = ctx.request.body;
    const user = await User
      .query()
      .where('email', email)
      .first();
    if (!user) throw new ValidationError('A user matching this email address does not exist');
    let token = await User.generatePasswordResetToken(user.id);
    token = token.replace(/\./g, '~');
    const context = {
      url: url.resolve(config.FRONTEND_URL, `/set-password/${token}`),
      name: user.name
    };
    const mailOptions = {
      from: config.MAIL_FROM,
      html: ejs.render(requestPasswordResetHTML, context),
      subject: 'Password reset request',
      text: ejs.render(requestPasswordResetTXT, context),
      to: email
    };
    sendMail(mailOptions)
      .then(info => {
        console.log('Message sent: %s', info.messageId); // tslint:disable-line
      })
      .catch(err => {
        console.error(err);
      });
    ctx.body = user;
  }

  async setPassword(ctx: Koa.Context) {
    const errors = validate(ctx.request.body, setPasswordConstraints);
    if (errors) {
      const err = new ValidationError();
      err.errors = errors;
      throw err;
    }
    const { token, password } = ctx.request.body;
    const { userId } = await User.verifyPasswordResetToken(token);
    const user = await User.setPassword(userId, password);
    ctx.body = user;
  }

  async changePassword(ctx: Koa.Context) {
    const errors = validate(ctx.request.body, changePasswordConstraints);
    if (errors) {
      const err = new ValidationError();
      err.errors = errors;
      throw err;
    }
    const { password, newPassword } = ctx.request.body;
    const { user } = ctx.state;
    if (!user.verifyPassword(password)) throw new ValidationError('Invalid password');
    ctx.body = await User.setPassword(user.id, newPassword);
  }

}
