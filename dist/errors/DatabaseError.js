"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseError_1 = require("./BaseError");
class DatabaseError extends BaseError_1.default {
    constructor(message = 'A database error occurred') {
        super(message);
        this.name = 'DatabaseError';
        this.status = 500;
    }
}
exports.default = DatabaseError;
