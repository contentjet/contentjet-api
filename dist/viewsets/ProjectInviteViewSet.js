"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const url = require("url");
const ejs = require("ejs");
const { mjml2html } = require('mjml'); // tslint:disable-line
const config_1 = require("../config");
const lodash_1 = require("lodash");
const BaseViewSet_1 = require("./BaseViewSet");
const ProjectInvite_1 = require("../models/ProjectInvite");
const ValidationError_1 = require("../errors/ValidationError");
const middleware_1 = require("../authentication/jwt/middleware");
const middleware_2 = require("../authorization/middleware");
const objection_1 = require("objection");
const validate_1 = require("../utils/validate");
const sendMail = config_1.default.MAIL_BACKEND.sendMail;
const projectInviteHTML = mjml2html(fs.readFileSync(path.resolve(__dirname, '../../templates/mail/project-invite.mjml'), 'utf8')).html;
const projectInviteTXT = fs.readFileSync(path.resolve(__dirname, '../../templates/mail/project-invite.txt'), 'utf8');
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
class ProjectInviteViewSet extends BaseViewSet_1.default {
    constructor(options) {
        const clonedOptions = lodash_1.cloneDeep(options);
        clonedOptions.disabledActions = ['update'];
        super(ProjectInvite_1.default, clonedOptions);
        this.accept = this.accept.bind(this);
        this.bulkDelete = this.bulkDelete.bind(this);
        this.router.put('accept', middleware_1.requireAuthentication, this.accept);
        this.router.post('bulk-delete', middleware_1.requireAuthentication, middleware_2.requirePermission(`${this.modelClass.tableName}:delete`), this.bulkDelete);
    }
    getCommonMiddleware() {
        return [middleware_1.requireAuthentication];
    }
    getListQueryBuilder() {
        // Only list pending invites
        return ProjectInvite_1.default
            .query()
            .where('accepted', false);
    }
    getPageSize() {
        return 0;
    }
    async create(ctx) {
        const errors = validate_1.default(ctx.request.body, createConstraints);
        if (errors) {
            const err = new ValidationError_1.default();
            err.errors = errors;
            throw err;
        }
        const { project } = ctx.state;
        const { name, email } = ctx.request.body;
        // If an invite for this project and email already exists we simply return
        // the existing one without error.
        const existingProjectInvite = await ProjectInvite_1.default
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
        let token = await ProjectInvite_1.default.generateInviteToken(projectInvite.id, project.name, project.id);
        token = token.replace(/\./g, '~');
        const context = {
            url: url.resolve(config_1.default.FRONTEND_URL, `/accept-invite/${token}`),
            projectName: project.name,
            name
        };
        const mailOptions = {
            from: config_1.default.MAIL_FROM,
            to: email,
            subject: 'You have been invited to join a project',
            text: ejs.render(projectInviteTXT, context),
            html: ejs.render(projectInviteHTML, context)
        };
        sendMail(mailOptions)
            .then(info => {
            console.log('Message sent: %s', info.messageId); // tslint:disable-line
        })
            .catch(err => {
            console.error(err);
        });
        return projectInvite;
    }
    async accept(ctx) {
        const errors = validate_1.default(ctx.request.body, acceptConstraints);
        if (errors) {
            const err = new ValidationError_1.default();
            err.errors = errors;
            throw err;
        }
        const { token } = ctx.request.body;
        const { project, user } = ctx.state;
        const { projectInviteId } = await ProjectInvite_1.default.verifyInviteToken(token);
        const knex = ProjectInvite_1.default.knex();
        await objection_1.transaction(knex, async (trx) => {
            // Mark the invite as accepted...
            const projectInvite = await ProjectInvite_1.default.accept(projectInviteId, trx);
            // ... and make the authenticated user a member
            await project.addUser(user, 'author', trx);
            ctx.body = projectInvite;
        });
    }
    async bulkDelete(ctx) {
        const arrayOfIds = ctx.request.body;
        const error = validate_1.default.single(arrayOfIds, { arrayOfIds: true });
        if (error)
            throw new ValidationError_1.default(error[0]);
        const { project } = ctx.state;
        await ProjectInvite_1.default.bulkDelete(arrayOfIds, project.id);
        ctx.status = 204;
    }
}
exports.default = ProjectInviteViewSet;
