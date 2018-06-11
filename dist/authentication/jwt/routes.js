"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("../../models/User");
const Client_1 = require("../../models/Client");
const AuthenticationError_1 = require("../../errors/AuthenticationError");
const ValidationError_1 = require("../../errors/ValidationError");
const utils_1 = require("./utils");
const validate_1 = require("../../utils/validate");
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
async function authenticateUser(ctx) {
    const errors = validate_1.default(ctx.request.body, passwordAuthenticationConstraints);
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
    ctx.body = await utils_1.generateUserAuthToken({ userId: ctx.state.user.id });
}
exports.authenticateUser = authenticateUser;
async function authenticateClient(ctx) {
    const errors = validate_1.default(ctx.request.body, clientAuthenticationConstraints);
    if (errors) {
        const err = new ValidationError_1.default();
        err.errors = errors;
        throw err;
    }
    const { client_id, client_secret } = ctx.request.body;
    const client = await Client_1.default.authenticate(client_id, client_secret);
    if (!client)
        throw new AuthenticationError_1.default('A client with the submitted credentials does not exist');
    ctx.state.client = client;
    // NOTE: clientId in the encoded token references Client.id NOT Client.clientId.
    // The aud field contains Client.clientId.
    ctx.body = await utils_1.generateClientAuthToken({
        clientId: ctx.state.client.id,
        aud: ctx.state.client.clientId
    });
}
exports.authenticateClient = authenticateClient;
async function tokenRefresh(ctx) {
    const errors = validate_1.default(ctx.request.body, tokenRefreshConstraints);
    if (errors) {
        const err = new ValidationError_1.default();
        err.errors = errors;
        throw err;
    }
    const { refresh_token } = ctx.request.body;
    ctx.body = await utils_1.refreshUserAuthToken(refresh_token);
}
exports.tokenRefresh = tokenRefresh;
