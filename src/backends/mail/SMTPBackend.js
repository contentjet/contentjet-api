const config = require('../../config');
const BaseMailService = require('./BaseMailService');
const nodemailer = require('nodemailer');


class SMTPBackend extends BaseMailService {

  constructor() {
    super();
    const {options, defaults} = config.MAIL_BACKEND_CONFIG.smtp;
    this.transport = nodemailer.createTransport(options, defaults);
    this.sendMail = this.sendMail.bind(this);
  }

  sendMail(data) {
    return this.transport.sendMail(data);
  }

}

module.exports = SMTPBackend;
