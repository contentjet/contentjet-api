import * as path from 'path';
require('dotenv').config({path: path.resolve(__dirname, '../../.env')});
import IConfig from './IConfig';
import DiskStorageBackend from '../backends/storage/DiskStorageBackend';
import ModelPermissionBackend from '../backends/permissions/ModelPermissionBackend';
import ProjectPermissionBackend from '../backends/permissions/ProjectPermissionBackend';
import SMTPBackend from '../backends/mail/SMTPBackend';
import {get} from 'lodash';

function env(name: string, required: boolean = false): string {
  const value = get(process.env, name) as string;
  if (!value && required) throw new Error(`Invalid config: ${name} must be set`);
  return value;
};

const MEDIA_ROOT = env('MEDIA_ROOT') || 'media/';

const PORT = parseInt(env('PORT') || '3000');

const config: IConfig = {
  NODE_ENV: env('NODE_ENV', true),
  PORT: PORT,
  // Secret key used for hashing passwords and generating tokens
  SECRET_KEY: env('SECRET_KEY', true),
  // Database connection options. See http://knexjs.org/#Installation-client
  DATABASE: {
    client: 'postgresql', // Do not change. Only postgres is supported.
    connection: {
      host: env('POSTGRES_HOST') || 'localhost',
      port: parseInt(env('POSTGRES_PORT') || '5432'),
      database: env('POSTGRES_DB') || 'contentjet-api',
      user: env('POSTGRES_USER') || 'postgres',
      password: env('POSTGRES_PASSWORD') || 'password'
    },
    pool: {
      min: parseInt(env('POSTGRES_POOL_MIN') || '2'),
      max: parseInt(env('POSTGRES_POOL_MAX') || '10')
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },
  // The url where contentjet-ui is hosted
  FRONTEND_URL: env('FRONTEND_URL') || 'http://localhost:9000',
  // The url where contentjet-api (this app) is hosted
  BACKEND_URL: env('BACKEND_URL') || `http://localhost:${PORT}`,
  // The duration in seconds an authentication token (JWT) is valid for when authenticating
  // via the OAuth2 `Resource Owner Password Credentials Grant` flow. Default 5 mins.
  USER_TOKEN_EXPIRY: parseInt(env('USER_TOKEN_EXPIRY') || '300'),
  // The duration in seconds an authentication token (JWT) is valid for when authenticating
  // via the OAuth2 `Client Credentials Grant` flow. Default 1 hour.
  CLIENT_TOKEN_EXPIRY: parseInt(env('CLIENT_TOKEN_EXPIRY') || '3600'),
  // When false the user will receive a signup confirmation email. When true
  // the user will NOT receive a confirmation email and will have isActive = true
  // set immediately upon signup. Recommended this remains false in production.
  ACTIVE_ON_SIGNUP: !!parseInt(env('ACTIVE_ON_SIGNUP') || '0'),
  // When true, stack traces will be logged.
  DEBUG: !!parseInt(env('DEBUG') || '0'),
  // Cross-Origin Resource Sharing. See https://github.com/koajs/cors for options
  CORS: {
    origin: env('CORS_ORIGIN') || '*'
  },
  // Email address used in the 'from' field of all email sent by this app
  MAIL_FROM: env('MAIL_FROM', true),
  PERMISSION_BACKENDS: [
    new ModelPermissionBackend(),
    new ProjectPermissionBackend()
  ],
  // File storage service
  STORAGE_BACKEND: new DiskStorageBackend(MEDIA_ROOT),
  // File system path of storage directory. Required when storage backend is DiskStorageBackend.
  MEDIA_ROOT: MEDIA_ROOT,
  // When true files in MEDIA_ROOT will served at the path /media.
  // Use in production is strongly discouraged.
  SERVE_MEDIA: !!parseInt(env('SERVE_MEDIA') || '0'),
  // The URL uploaded media is served from
  MEDIA_URL: env('MEDIA_URL') || 'http://localhost:3000/media/',
  // The dimensions of thumbnails created from uploaded images. Set values to 0
  // to disable thumbnail generation.
  THUMBNAIL: {
    width: parseInt(env('THUMBNAIL_WIDTH') || '200'),
    height: parseInt(env('THUMBNAIL_HEIGHT') || '200')
  },
  MAIL_BACKEND: new SMTPBackend({
    host: env('SMTP_HOST', true),
    port: env('SMTP_PORT', true),
    auth: {
      user: env('SMTP_USER', true),
      pass: env('SMTP_PASSWORD', true)
    },
    secure: !!parseInt(env('SMTP_SECURE') || '0')
  }),
  // Whether or not to serve Swagger UI at /swagger endpoint. Defaults to true.
  SERVE_SWAGGER_UI: !!parseInt(env('SERVE_SWAGGER_UI') || '1')
};

export default config;
