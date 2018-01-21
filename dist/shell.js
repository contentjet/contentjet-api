"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const repl = require("repl");
const app_1 = require("./app");
const replServer = repl.start({ prompt: 'contentjet > ' });
replServer.context.app = app_1.default;
