import {merge} from 'lodash';
import IPermissionBackend from '../backends/permissions/IPermissionBackend';
import IMailService from '../backends/mail/IMailService';
import IStorageBackend from '../backends/storage/IStorageBackend';

interface IConfig {
  PORT: number;
  SECRET_KEY: string;
  DATABASE: any;
  FRONTEND_URL: string;
  TOKEN_EXPIRY: number;
  ACTIVE_ON_SIGNUP: boolean;
  DEBUG: boolean;
  CORS: any;
  MAIL_BACKEND: IMailService;
  MAIL_FROM: string;
  PERMISSION_BACKENDS: IPermissionBackend[];
  STORAGE_BACKEND: IStorageBackend;
  MEDIA_ROOT: string;
  SERVE_MEDIA: boolean;
  MEDIA_URL: string;
  THUMBNAIL: {
    width: number;
    height: number;
  }
}

let environmentConfig = null;
if (process.env.NODE_ENV) {
  try {
    environmentConfig = require(`./config.${process.env.NODE_ENV}`).default;
  } catch (err) {
    // Fail silently
  }
}

const config = merge(require('./config').default, environmentConfig) as IConfig;

if (!config.SECRET_KEY) throw new Error('Invalid config. SECRET_KEY must be set.');
if (!config.STORAGE_BACKEND) throw new Error('Invalid config. STORAGE_BACKEND must be set.');
if (!config.MAIL_BACKEND) throw new Error('Invalid config. MAIL_BACKEND must be set.');

export default config;
