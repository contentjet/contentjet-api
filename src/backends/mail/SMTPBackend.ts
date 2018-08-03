import { IMailBackend } from '../../types';
import * as nodemailer from 'nodemailer';
import * as Mail from 'nodemailer/lib/mailer';

export default class SMTPBackend implements IMailBackend {

  transport: Mail;

  constructor(options: any, defaults?: any) {
    this.transport = nodemailer.createTransport(options, defaults);
    this.sendMail = this.sendMail.bind(this);
  }

  sendMail(data: Mail.Options): Promise<nodemailer.SentMessageInfo> {
    return this.transport.sendMail(data);
  }

}
