"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseError_1 = require("./BaseError");
class AuthorizationError extends BaseError_1.default {
    constructor(message = 'Permission denied') {
        super(message);
        this.name = 'AuthorizationError';
        this.status = 403;
    }
}
exports.default = AuthorizationError;
