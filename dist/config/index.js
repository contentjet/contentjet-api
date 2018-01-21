"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
if (!process.env.NODE_ENV)
    throw new Error('NODE_ENV not set');
let environmentConfig = null;
if (process.env.NODE_ENV) {
    try {
        environmentConfig = require(`./config.${process.env.NODE_ENV}`).default;
    }
    catch (err) {
        // Fail silently
    }
}
const config = lodash_1.merge(require('./config').default, environmentConfig);
if (!config.SECRET_KEY)
    throw new Error('Invalid config. SECRET_KEY must be set.');
if (!config.STORAGE_BACKEND)
    throw new Error('Invalid config. STORAGE_BACKEND must be set.');
if (!config.MAIL_BACKEND)
    throw new Error('Invalid config. MAIL_BACKEND must be set.');
exports.default = config;
