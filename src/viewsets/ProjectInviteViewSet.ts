import * as Koa from 'koa';
import fs = require('fs');
import path = require('path');
import url = require('url');
import * as ejs from 'ejs';
import mjml2html = require('mjml');
import config from '../config';
import { cloneDeep } from 'lodash';
import BaseViewSet from './BaseViewSet';
import ProjectInvite from '../models/ProjectInvite';
import ValidationError from '../errors/ValidationError';
import { requireAuthentication } from '../authentication/jwt/middleware';
import { requirePermission } from '../authorization/middleware';
import { transaction } from 'objection';
import validate from '../utils/validate';

const projectInviteHTML = mjml2html(
  fs.readFileSync(
    path.resolve(__dirname, '../../templates/mail/project-invite.mjml'), 'utf8'
  )
).html;
const projectInviteTXT = fs.readFileSync(
  path.resolve(__dirname, '../../templates/mail/project-invite.txt'), 'utf8'
);

const createConstraints = {
  name: {
    presence: true,
    length: {
      maximum: 128
    }
  },
  email: {
    presence: true,
    email: true
  }
};

const acceptConstraints = {
  token: {
    presence: true
  }
};

export default class ProjectInviteViewSet extends BaseViewSet<ProjectInvite> {

  constructor(options: any) {
    const clonedOptions = cloneDeep(options);
    clonedOptions.disabledActions = ['update'];
    super(ProjectInvite, clonedOptions);
    this.accept = this.accept.bind(this);
    this.bulkDelete = this.bulkDelete.bind(this);
    this.router.put(
      'accept',
      requireAuthentication,
      this.accept
    );
    this.router.post(
      'bulk-delete',
      requireAuthentication,
      requirePermission(`${this.modelClass.tableName}:delete`),
      this.bulkDelete
    );
  }

  getCommonMiddleware() {
    return [requireAuthentication];
  }

  getListQueryBuilder() {
    // Only list pending invites
    return ProjectInvite
      .query()
      .where('accepted', false);
  }

  getPageSize() {
    return 0;
  }

  async create(ctx: Koa.Context) {
    const errors = validate(ctx.request.body, createConstraints);
    if (errors) {
      const err = new ValidationError();
      err.errors = errors;
      throw err;
    }
    const { project } = ctx.state;
    const { name, email } = ctx.request.body;
    // If an invite for this project and email already exists we simply return
    // the existing one without error.
    const existingProjectInvite = await ProjectInvite
      .query()
      .where({
        projectId: project.id,
        email
      })
      .first();
    if (existingProjectInvite) {
      ctx.body = existingProjectInvite;
      return existingProjectInvite;
    }
    ctx.request.body.userId = ctx.state.user.id;
    ctx.request.body.projectId = ctx.state.project.id;
    ctx.request.body.accepted = false;
    const projectInvite = await super.create(ctx);
    let token = await ProjectInvite.generateInviteToken(
      projectInvite.id, project.name, project.id
    );
    token = token.replace(/\./g, '~');
    const context = {
      url: url.resolve(config.FRONTEND_URL, `/accept-invite/${token}`),
      projectName: project.name,
      name
    };
    const mailOptions = {
      from: config.MAIL_FROM,
      to: email,
      subject: 'You have been invited to join a project',
      text: ejs.render(projectInviteTXT, context),
      html: ejs.render(projectInviteHTML, context)
    };
    this.options.mail.sendMail(mailOptions)
      .then(info => {
        console.log('Message sent: %s', info.messageId); // tslint:disable-line
      })
      .catch(err => {
        console.error(err);
      });
    return projectInvite;
  }

  async accept(ctx: Koa.Context) {
    const errors = validate(ctx.request.body, acceptConstraints);
    if (errors) {
      const err = new ValidationError();
      err.errors = errors;
      throw err;
    }
    const { token } = ctx.request.body;
    const { project, user } = ctx.state;
    const { projectInviteId } = await ProjectInvite.verifyInviteToken(token);
    const knex = ProjectInvite.knex();
    await transaction(knex, async trx => {
      // Mark the invite as accepted...
      const projectInvite = await ProjectInvite.accept(projectInviteId, trx);
      // ... and make the authenticated user a member
      await project.addUser(user, 'author', trx);
      ctx.body = projectInvite;
    });
  }

  async bulkDelete(ctx: Koa.Context) {
    const arrayOfIds = ctx.request.body;
    const error = validate.single(arrayOfIds, { arrayOfIds: true });
    if (error) throw new ValidationError(error[0]);
    const { project } = ctx.state;
    await ProjectInvite.bulkDelete(arrayOfIds, project.id);
    ctx.status = 204;
  }

}
