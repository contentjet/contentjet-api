"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("../../models/User");
const Client_1 = require("../../models/Client");
const AuthenticationError_1 = require("../../errors/AuthenticationError");
const utils_1 = require("./utils");
async function requireAuthentication(ctx, next) {
    if (!ctx.request.headers.authorization)
        throw new AuthenticationError_1.default('Authorization header is missing');
    if (!ctx.request.headers.authorization.startsWith('Bearer'))
        throw new AuthenticationError_1.default('Invalid authorization header');
    const accessToken = ctx.request.headers.authorization.replace('Bearer', '').replace(' ', '');
    const payload = await utils_1.verifyAuthToken(accessToken);
    if (payload.userId) {
        ctx.state.user = await User_1.default.getById(payload.userId);
    }
    else if (payload.clientId) {
        ctx.state.client = await Client_1.default.getById(payload.clientId);
    }
    await next();
}
exports.requireAuthentication = requireAuthentication;
