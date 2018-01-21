"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseError_1 = require("./BaseError");
class ValidationError extends BaseError_1.default {
    constructor(message = 'A validation error occurred') {
        super(message);
        this.name = 'ValidationError';
        this.status = 400;
    }
    toJSON() {
        let json = super.toJSON();
        json.errors = this.errors;
        return json;
    }
}
exports.default = ValidationError;
