"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer = require("nodemailer");
class SMTPBackend {
    constructor(options, defaults) {
        this.transport = nodemailer.createTransport(options, defaults);
        this.sendMail = this.sendMail.bind(this);
    }
    sendMail(data) {
        return this.transport.sendMail(data);
    }
}
exports.default = SMTPBackend;
