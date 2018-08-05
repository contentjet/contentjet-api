"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const send = require("koa-send");
const config_1 = require("../config");
exports.default = async (ctx, next) => {
    if (ctx.path.match(/^\/media\/.*$/)) {
        await send(ctx, path.join(config_1.default.MEDIA_ROOT, ctx.path.replace('/media/', '')));
    }
    else {
        await next();
    }
};
