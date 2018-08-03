import * as Koa from 'koa';
import * as nodemailer from 'nodemailer';
import Mail = require('nodemailer/lib/mailer');
import Project from './models/Project';

export interface IPermissionBackend {
  hasPermission(ctx: Koa.Context, permissionName: string, options?: any): Promise<boolean>;
}

export interface IMailBackend {
  sendMail(data: Mail.Options): Promise<nodemailer.SentMessageInfo>;
}

export interface IFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  thumbnailBuffer: Buffer | undefined;
  width: number | undefined;
  height: number | undefined;
}

export interface IStorageResponse {
  filePath: string;
  thumbnailPath?: string;
}

export interface IStorageBackend {
  write(project: Project, file: IFile): Promise<IStorageResponse>;
}

export interface IConfig {
  NODE_ENV: string;
  PORT: number;
  SECRET_KEY: string;
  DATABASE: {
    client: string;
    connection: {
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
    };
    pool: {
      min: number;
      max: number;
    };
    migrations: {
      tableName: string;
    };
  };
  FRONTEND_URL: string;
  BACKEND_URL: string;
  USER_TOKEN_EXPIRY: number;
  CLIENT_TOKEN_EXPIRY: number;
  ACTIVE_ON_SIGNUP: boolean;
  DEBUG: boolean;
  CORS: {
    origin: string;
  };
  MAIL_FROM: string;
  PERMISSION_BACKENDS: IPermissionBackend[];
  STORAGE_BACKEND: IStorageBackend;
  MEDIA_ROOT: string;
  SERVE_MEDIA: boolean;
  MEDIA_URL: string;
  THUMBNAIL: {
    width: number;
    height: number;
  };
  MAIL_BACKEND: IMailBackend;
  SERVE_SWAGGER_UI: boolean;
}

export interface IWebHookEventPayload {
  dateTime: Date;
  action: string;
  model: string;
  project: object;
  webHook: object;
  target: Array<{id: number}>;
}
