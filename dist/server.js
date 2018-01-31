"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const config_1 = require("./config");
const app_1 = require("./app");
app_1.default.listen(config_1.default.PORT, function () {
    console.log(`Listening on port ${config_1.default.PORT}!`);
});
