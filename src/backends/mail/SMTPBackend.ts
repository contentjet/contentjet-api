import * as nodemailer from 'nodemailer';
import * as Mail from 'nodemailer/lib/mailer';
import { getEnv } from '../../utils/env';
import { IMailBackend } from '../../types';

export default class SMTPBackend implements IMailBackend {

  transport: Mail;

  constructor() {
    const options: any = {
      host: getEnv('SMTP_HOST', true),
      port: getEnv('SMTP_PORT', true),
      auth: {
        user: getEnv('SMTP_USER', true),
        pass: getEnv('SMTP_PASSWORD', true)
      },
      secure: !!parseInt(getEnv('SMTP_SECURE') || '0', 10)
    };
    this.transport = nodemailer.createTransport(options);
    this.sendMail = this.sendMail.bind(this);
  }

  sendMail(data: Mail.Options): Promise<nodemailer.SentMessageInfo> {
    return this.transport.sendMail(data);
  }

}
