"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EntryTag_1 = require("../models/EntryTag");
const BaseViewSet_1 = require("./BaseViewSet");
const middleware_1 = require("../authentication/jwt/middleware");
const lodash_1 = require("lodash");
class EntryTagViewSet extends BaseViewSet_1.default {
    constructor(options) {
        const clonedOptions = lodash_1.cloneDeep(options);
        clonedOptions.disabledActions = ['create', 'retrieve', 'delete', 'update'];
        super(EntryTag_1.default, clonedOptions);
    }
    getCommonMiddleware() {
        return [middleware_1.requireAuthentication];
    }
    getPageSize() {
        return 0;
    }
    getListQueryBuilder(ctx) {
        return EntryTag_1.default.getInProject(ctx.state.project.id);
    }
    async list(ctx) {
        const results = await super.list(ctx);
        const entryTagList = results.map(entryTag => entryTag.name);
        ctx.body = entryTagList;
        return results;
    }
}
exports.default = EntryTagViewSet;
