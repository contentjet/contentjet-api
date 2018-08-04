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
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_DB: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_POOL_MIN: number;
  POSTGRES_POOL_MAX: number;
  FRONTEND_URL: string;
  BACKEND_URL: string;
  USER_TOKEN_EXPIRY: number;
  CLIENT_TOKEN_EXPIRY: number;
  ACTIVE_ON_SIGNUP: boolean;
  DEBUG: boolean;
  CORS_ORIGIN: string;
  MAIL_FROM: string;
  STORAGE_BACKEND: string;
  MEDIA_ROOT: string;
  SERVE_MEDIA: boolean;
  MEDIA_URL: string;
  THUMBNAIL_WIDTH: number;
  THUMBNAIL_HEIGHT: number;
  MAIL_BACKEND: string;
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
