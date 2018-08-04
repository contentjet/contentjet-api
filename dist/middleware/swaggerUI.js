"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const url = require("url");
const send = require("koa-send");
// tslint:disable-next-line
const swaggerUIAbsolutePath = require('swagger-ui-dist').absolutePath();
const config_1 = require("../config");
exports.default = () => {
    const swaggerIndex = fs
        .readFileSync(path.join(swaggerUIAbsolutePath, 'index.html'), { encoding: 'utf8' })
        .replace(/http:\/\/petstore\.swagger\.io\/v2\/swagger\.json/g, url.resolve(config_1.default.BACKEND_URL, 'spec'));
    return async (ctx, next) => {
        if (ctx.path.match(/^\/swagger\/.*$/)) {
            const _path = ctx.path.replace('/swagger/', '');
            if (_path === '' || _path === '/index.html') {
                ctx.body = swaggerIndex;
                return;
            }
            await send(ctx, _path, { root: swaggerUIAbsolutePath });
        }
        else {
            await next();
        }
    };
};
