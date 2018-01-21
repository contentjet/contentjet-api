"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseError_1 = require("./BaseError");
class NotFoundError extends BaseError_1.default {
    constructor(message = 'Not found') {
        super(message);
        this.name = 'NotFoundError';
        this.status = 404;
    }
}
exports.default = NotFoundError;
