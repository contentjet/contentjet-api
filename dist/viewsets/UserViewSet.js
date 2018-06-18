"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const url = require("url");
const ejs = require("ejs");
const lodash_1 = require("lodash");
const { mjml2html } = require('mjml');
const objection_1 = require("objection");
const User_1 = require("../models/User");
const Project_1 = require("../models/Project");
const ProjectInvite_1 = require("../models/ProjectInvite");
const BaseViewSet_1 = require("./BaseViewSet");
const ValidationError_1 = require("../errors/ValidationError");
const NotFoundError_1 = require("../errors/NotFoundError");
const config_1 = require("../config");
const middleware_1 = require("../authentication/jwt/middleware");
const validate_1 = require("../utils/validate");
const sendMail = config_1.default.MAIL_BACKEND.sendMail;
const signUpHTML = mjml2html(fs.readFileSync(path.resolve(__dirname, '../../templates/mail/sign-up-verify.mjml'), 'utf8')).html;
const signUpTXT = fs.readFileSync(path.resolve(__dirname, '../../templates/mail/sign-up-verify.txt'), 'utf8');
const requestPasswordResetHTML = mjml2html(fs.readFileSync(path.resolve(__dirname, '../../templates/mail/request-password-reset.mjml'), 'utf8')).html;
const requestPasswordResetTXT = fs.readFileSync(path.resolve(__dirname, '../../templates/mail/request-password-reset.txt'), 'utf8');
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
class UserViewSet extends BaseViewSet_1.default {
    constructor(options) {
        const clonedOptions = lodash_1.cloneDeep(options);
        clonedOptions.disabledActions = ['create', 'delete', 'update'];
        super(User_1.default, clonedOptions);
        this.retrieveMe = this.retrieveMe.bind(this);
        this.updateMe = this.updateMe.bind(this);
        this.signUp = this.signUp.bind(this);
        this.verify = this.verify.bind(this);
        this.setPassword = this.setPassword.bind(this);
        this.requestPasswordReset = this.requestPasswordReset.bind(this);
        this.changePassword = this.changePassword.bind(this);
        this.router.get('me', middleware_1.requireAuthentication, this.retrieveMe);
        this.router.put('me', middleware_1.requireAuthentication, this.updateMe);
        this.router.post('sign-up', this.signUp);
        this.router.post('verify', this.verify);
        this.router.post('request-password-reset', this.requestPasswordReset);
        this.router.post('set-password', this.setPassword);
        this.router.post('change-password', middleware_1.requireAuthentication, this.changePassword);
    }
    getListMiddleware() {
        const middleware = [middleware_1.requireAuthentication];
        return middleware.concat(super.getListMiddleware());
    }
    getCreateMiddleware() {
        const middleware = [middleware_1.requireAuthentication];
        return middleware.concat(super.getCreateMiddleware());
    }
    getRetrieveMiddleware() {
        const middleware = [middleware_1.requireAuthentication];
        return middleware.concat(super.getRetrieveMiddleware());
    }
    getUpdateMiddleware() {
        const middleware = [middleware_1.requireAuthentication];
        return middleware.concat(super.getUpdateMiddleware());
    }
    getDeleteMiddleware() {
        const middleware = [middleware_1.requireAuthentication];
        return middleware.concat(super.getDeleteMiddleware());
    }
    retrieveMe(ctx) {
        ctx.body = ctx.state.user;
    }
    async updateMe(ctx) {
        const errors = validate_1.default(ctx.request.body, updateMeConstraints);
        if (errors) {
            const err = new ValidationError_1.default();
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
    async signUp(ctx) {
        const errors = validate_1.default(ctx.request.body, signUpConstraints);
        if (errors) {
            const err = new ValidationError_1.default();
            err.errors = errors;
            throw err;
        }
        const { email, name, password, inviteToken } = ctx.request.body;
        try {
            var invitePayload = await ProjectInvite_1.default.verifyInviteToken(inviteToken);
        }
        catch (err) {
            throw new ValidationError_1.default('Invalid invite token');
        }
        const knex = ProjectInvite_1.default.knex();
        await objection_1.transaction(knex, async (trx) => {
            const user = await User_1.default.create(email, name, password, config_1.default.ACTIVE_ON_SIGNUP, false, trx);
            // Get the project from the invite...
            const { projectId, projectInviteId } = invitePayload;
            const project = await Project_1.default.getById(projectId, trx);
            if (!project)
                throw new NotFoundError_1.default('Project does not exist');
            // ... mark the invite as accepted...
            await ProjectInvite_1.default.accept(projectInviteId, trx);
            // ... and make the user a member of the project.
            await project.addUser(user, 'author', trx);
            // Send verification email
            if (!config_1.default.ACTIVE_ON_SIGNUP) {
                let token = await User_1.default.generateSignUpToken(user.id);
                token = token.replace(/\./g, '~');
                const context = {
                    url: url.resolve(config_1.default.FRONTEND_URL, `/sign-up/verify/${token}`),
                    name
                };
                const mailOptions = {
                    from: config_1.default.MAIL_FROM,
                    to: email,
                    subject: 'Please verify your email address',
                    text: ejs.render(signUpTXT, context),
                    html: ejs.render(signUpHTML, context)
                };
                sendMail(mailOptions)
                    .then(info => {
                    console.log('Message sent: %s', info.messageId);
                })
                    .catch(err => {
                    console.error(err);
                });
            }
            ctx.status = 201;
            ctx.body = user;
        });
    }
    async verify(ctx) {
        const { token } = ctx.request.body;
        if (!token)
            throw new ValidationError_1.default('Verification token is required');
        const { userId } = await User_1.default.verifySignUpToken(token);
        const user = await User_1.default
            .query()
            .patch({ isActive: true })
            .returning('*')
            .where('id', userId)
            .first();
        ctx.body = user;
    }
    async requestPasswordReset(ctx) {
        const errors = validate_1.default(ctx.request.body, requestPasswordResetConstraints);
        if (errors) {
            const err = new ValidationError_1.default();
            err.errors = errors;
            throw err;
        }
        const { email } = ctx.request.body;
        const user = await User_1.default
            .query()
            .where('email', email)
            .first();
        if (!user)
            throw new ValidationError_1.default('A user matching this email address does not exist');
        let token = await User_1.default.generatePasswordResetToken(user.id);
        token = token.replace(/\./g, '~');
        const context = {
            url: url.resolve(config_1.default.FRONTEND_URL, `/set-password/${token}`),
            name: user.name
        };
        const mailOptions = {
            from: config_1.default.MAIL_FROM,
            to: email,
            subject: 'Password reset request',
            text: ejs.render(requestPasswordResetTXT, context),
            html: ejs.render(requestPasswordResetHTML, context)
        };
        sendMail(mailOptions)
            .then(info => {
            console.log('Message sent: %s', info.messageId);
        })
            .catch(err => {
            console.error(err);
        });
        ctx.body = user;
    }
    async setPassword(ctx) {
        const errors = validate_1.default(ctx.request.body, setPasswordConstraints);
        if (errors) {
            const err = new ValidationError_1.default();
            err.errors = errors;
            throw err;
        }
        const { token, password } = ctx.request.body;
        const { userId } = await User_1.default.verifyPasswordResetToken(token);
        const user = await User_1.default.setPassword(userId, password);
        ctx.body = user;
    }
    async changePassword(ctx) {
        const errors = validate_1.default(ctx.request.body, changePasswordConstraints);
        if (errors) {
            const err = new ValidationError_1.default();
            err.errors = errors;
            throw err;
        }
        const { password, newPassword } = ctx.request.body;
        const { user } = ctx.state;
        if (!user.verifyPassword(password))
            throw new ValidationError_1.default('Invalid password');
        ctx.body = await User_1.default.setPassword(user.id, newPassword);
    }
}
exports.default = UserViewSet;
