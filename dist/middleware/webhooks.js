"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const lodash_1 = require("lodash");
const actionToEventMap = {
    bulkDelete: 'DeletedBulk',
    create: 'Created',
    delete: 'Deleted',
    update: 'Updated'
};
const actions = Object.keys(actionToEventMap);
async function default_1(ctx, next) {
    // Immediately pass control to the next middleware. We invoke web hooks
    // asynchronously after all other middleware.
    await next();
    const { project, viewsetResult } = ctx.state;
    if (!viewsetResult || !project)
        return;
    const { modelClass, action, data } = viewsetResult;
    if (!actions.includes(action))
        return;
    const webHooks = await project.getActiveWebHooks();
    for (const webHook of webHooks) {
        const event = `${modelClass.tableName}${actionToEventMap[action]}`;
        if (!lodash_1.get(webHook, event))
            continue;
        // For bulkDelete action data is an array of the deleted record ids
        const payload = {
            action,
            dateTime: new Date(),
            model: modelClass.tableName,
            project: lodash_1.pick(project, ['id', 'name']),
            target: actionToEventMap[action] === 'DeletedBulk' ? data : [lodash_1.pick(data, 'id')],
            webHook: lodash_1.pick(webHook, ['id', 'name', 'url'])
        };
        // We intentionally don't use await here as we don't
        // want to block the downstream middleware from returning
        // the response.
        axios_1.default
            .post(webHook.url, payload)
            .catch(err => {
            console.error(err);
        });
    }
}
exports.default = default_1;
