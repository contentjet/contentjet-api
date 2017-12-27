const config = require('../../config');
import IMailService from './IMailService';
import * as mg from 'nodemailer-mailgun-transport';
import * as nodemailer from 'nodemailer';
import * as Mail from 'nodemailer/lib/mailer';

export default class MailGunBackend implements IMailService {

  transport: Mail;

  constructor() {
    this.transport = nodemailer.createTransport(mg(config.MAIL_BACKEND_CONFIG.mailGun));
    this.sendMail = this.sendMail.bind(this);
  }

  sendMail(data: Mail.Options): Promise<nodemailer.SentMessageInfo> {
    return this.transport.sendMail(data);
  }

}
