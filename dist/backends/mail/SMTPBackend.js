"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer = require("nodemailer");
const env_1 = require("../../utils/env");
class SMTPBackend {
    constructor() {
        const options = {
            host: env_1.getEnv('SMTP_HOST', true),
            port: env_1.getEnv('SMTP_PORT', true),
            auth: {
                user: env_1.getEnv('SMTP_USER', true),
                pass: env_1.getEnv('SMTP_PASSWORD', true)
            },
            secure: !!parseInt(env_1.getEnv('SMTP_SECURE') || '0', 10)
        };
        this.transport = nodemailer.createTransport(options);
        this.sendMail = this.sendMail.bind(this);
    }
    sendMail(data) {
        return this.transport.sendMail(data);
    }
}
exports.default = SMTPBackend;
