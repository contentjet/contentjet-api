"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseError_1 = require("./BaseError");
class AuthenticationError extends BaseError_1.default {
    constructor(message = 'An authentication error occurred') {
        super(message);
        this.name = 'AuthenticationError';
        this.status = 401;
    }
}
exports.default = AuthenticationError;
