const config = require('../../config');
const BaseMailService = require('./BaseMailService');
const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');

class MailGunBackend extends BaseMailService {

  constructor() {
    super();
    this.transport = nodemailer.createTransport(mg(config.MAIL_BACKEND_CONFIG.mailGun));
    this.sendMail = this.sendMail.bind(this);
  }

  sendMail(data) {
    return this.transport.sendMail(data);
  }

}

module.exports = MailGunBackend;
