const fs = require('fs');
const path = require('path');
const url = require('url');
const ejs = require('ejs');
const { mjml2html } = require('mjml');
const config = require('../config');
const _ = require('lodash');
const BaseViewSet = require('./BaseViewSet');
const ProjectInvite = require('../models/ProjectInvite');
const ValidationError = require('../errors/ValidationError');
const {requireAuthentication} = require('../authentication/jwt/middleware');
const {requirePermission} = require('../authorization/middleware');
const transaction = require('objection').transaction;
const validate = require('../utils/validate');

const projectInviteHTML = mjml2html(
  fs.readFileSync(
    path.resolve(__dirname, '../templates/mail/project-invite.mjml'), 'utf8'
  )
).html;
const projectInviteTXT = fs.readFileSync(
  path.resolve(__dirname, '../templates/mail/project-invite.txt'), 'utf8'
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

class ProjectInviteViewSet extends BaseViewSet {

  constructor(options) {
    const clonedOptions = _.cloneDeep(options);
    clonedOptions.disabledActions = ['update'];
    super(ProjectInvite, clonedOptions);
    this.accept = this.accept.bind(this);
    this.bulkDelete = this.bulkDelete.bind(this);
    this.router.put('accept', this.accept);
    this.router.post('bulk-delete', requirePermission(`${this.Model.tableName}:delete`), this.bulkDelete);
  }

  getCommonMiddleware() {
    return [requireAuthentication];
  }

  getListQueryBuilder(ctx) {
    // Only list pending invites
    return ProjectInvite
      .query()
      .where('accepted', false);
  }

  async create(ctx, next) {
    const errors = validate(ctx.request.body, createConstraints);
    if (errors) {
      const err = new ValidationError();
      err.errors = errors;
      throw err;
    }
    const {project} = ctx.state;
    const {name, email} = ctx.request.body;
    // If an invite for this project and email already exists we simply return
    // the existing one without error.
    const existingProjectInvite = await ProjectInvite
      .query()
      .where({
        projectId: project.id,
        email: email
      })
      .first();
    if (existingProjectInvite) {
      ctx.body = existingProjectInvite;
      return existingProjectInvite;
    }
    ctx.request.body.userId = ctx.state.user.id;
    ctx.request.body.projectId = ctx.state.project.id;
    ctx.request.body.accepted = false;
    const projectInvite = await super.create(ctx, next);
    let token = await ProjectInvite.generateInviteToken(
      projectInvite.id, project.name, project.id
    );
    token = token.replace(/\./g, '~');
    const context = {
      url: url.resolve(config.FRONTEND_URL, `/accept-invite/${token}`),
      projectName: project.name,
      name: name
    };
    const mailOptions = {
      from: config.MAIL_FROM,
      to: email,
      subject: 'You have been invited to join a project',
      text: ejs.render(projectInviteTXT, context),
      html: ejs.render(projectInviteHTML, context)
    };
    ctx.sendMail(mailOptions, (err, info) => {
      if (err) return console.log(err);
      console.log('Message sent: %s', info.messageId);
    });
  }

  async accept(ctx, next) {
    const errors = validate(ctx.request.body, acceptConstraints);
    if (errors) {
      const err = new ValidationError();
      err.errors = errors;
      throw err;
    }
    const {token} = ctx.request.body;
    const {project, user} = ctx.state;
    const {projectInviteId} = await ProjectInvite.verifyInviteToken(token);
    const knex = ProjectInvite.knex();
    await transaction(knex, async (trx) => {
      // Mark the invite as accepted...
      await ProjectInvite.accept(projectInviteId, trx);
      // ... and make the authenticated user a member
      await project.addUser(user, 'author', trx);
      ctx.body = 'OK';
    });
  }

  async bulkDelete(ctx, next) {
    const arrayOfIds = ctx.request.body;
    const error = validate.single(arrayOfIds, { arrayOfIds: true });
    if (error) throw new ValidationError(error[0]);
    const {project} = ctx.state;
    await ProjectInvite.bulkDelete(arrayOfIds, project.id);
    ctx.status = 204;
  }

}

module.exports = ProjectInviteViewSet;
