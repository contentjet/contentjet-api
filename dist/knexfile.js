"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
module.exports[process.env.NODE_ENV] = config_1.default.DATABASE;
