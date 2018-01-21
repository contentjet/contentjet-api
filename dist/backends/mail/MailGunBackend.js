"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mg = require("nodemailer-mailgun-transport");
const nodemailer = require("nodemailer");
class MailGunBackend {
    constructor(apiKey, domain) {
        const mgOptions = {
            auth: {
                api_key: apiKey,
                domain: domain
            }
        };
        this.transport = nodemailer.createTransport(mg(mgOptions));
        this.sendMail = this.sendMail.bind(this);
    }
    sendMail(data) {
        return this.transport.sendMail(data);
    }
}
exports.default = MailGunBackend;
