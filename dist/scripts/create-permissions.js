"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("../app");
const actions = ['create', 'update', 'list', 'retrieve', 'delete'];
const { Permission } = app_1.models;
const modelClasses = Object.values(app_1.models);
async function createPermissions() {
    for (let Model of modelClasses) {
        for (let action of actions) {
            await Permission.getOrCreate(`${Model.tableName}:${action}`);
        }
    }
    process.exit();
}
createPermissions();
