"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objection_1 = require("objection");
const NotFoundError_1 = require("../errors/NotFoundError");
const ValidationError_1 = require("../errors/ValidationError");
const AuthenticationError_1 = require("../errors/AuthenticationError");
const jwt = require("jsonwebtoken");
const config_1 = require("../config");
exports.default = async (ctx, next) => {
    try {
        await next();
        // Catch Koa's stadard 404 response and throw our own error
        if (ctx.response.status === 404)
            throw new NotFoundError_1.default();
    }
    catch (err) {
        if (err instanceof objection_1.ValidationError) {
            const e = new ValidationError_1.default();
            e.errors = err.data;
            ctx.body = e;
            ctx.status = e.status;
        }
        else if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
            const e = new AuthenticationError_1.default(err.message);
            ctx.body = e;
            ctx.status = e.status;
        }
        else {
            ctx.status = err.status || err.statusCode || 500;
            ctx.body = err;
        }
        // tslint:disable-next-line
        if (config_1.default.DEBUG)
            console.log(err.stack);
    }
};
