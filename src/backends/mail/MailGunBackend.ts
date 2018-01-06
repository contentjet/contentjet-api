import IMailService from './IMailService';
import * as mg from 'nodemailer-mailgun-transport';
import * as nodemailer from 'nodemailer';
import * as Mail from 'nodemailer/lib/mailer';

export default class MailGunBackend implements IMailService {

  transport: Mail;

  constructor(apiKey: string, domain: string) {
    const mgOptions = {
      auth: {
        api_key: apiKey,
        domain: domain
      }
    };
    this.transport = nodemailer.createTransport(mg(mgOptions));
    this.sendMail = this.sendMail.bind(this);
  }

  sendMail(data: Mail.Options): Promise<nodemailer.SentMessageInfo> {
    return this.transport.sendMail(data);
  }

}
