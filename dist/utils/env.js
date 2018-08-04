"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
exports.getEnv = (name, required = false) => {
    const value = lodash_1.get(process.env, name);
    if (!value && required)
        throw new Error(`Missing environment variable. ${name} must be set`);
    return value;
};
