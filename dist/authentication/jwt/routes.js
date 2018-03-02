"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("../../models/User");
const AuthenticationError_1 = require("../../errors/AuthenticationError");
const ValidationError_1 = require("../../errors/ValidationError");
const utils_1 = require("./utils");
const validate_1 = require("../../utils/validate");
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
async function authenticate(ctx) {
    const errors = validate_1.default(ctx.request.body, authenticationConstraints);
    if (errors) {
        const err = new ValidationError_1.default();
        err.errors = errors;
        throw err;
    }
    const { username, password } = ctx.request.body;
    const user = await User_1.default.authenticate(username, password);
    if (!user)
        throw new AuthenticationError_1.default('A user with the submitted credentials does not exist');
    if (!user.isActive)
        throw new AuthenticationError_1.default('User is marked inactive');
    ctx.state.user = user;
    ctx.body = await utils_1.generateAuthToken({ userId: ctx.state.user.id });
}
exports.authenticate = authenticate;
async function tokenRefresh(ctx) {
    const errors = validate_1.default(ctx.request.body, tokenRefreshConstraints);
    if (errors) {
        const err = new ValidationError_1.default();
        err.errors = errors;
        throw err;
    }
    const { refresh_token } = ctx.request.body;
    ctx.body = await utils_1.refreshAuthToken(refresh_token);
}
exports.tokenRefresh = tokenRefresh;
