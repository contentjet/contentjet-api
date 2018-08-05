import * as path from 'path';
import * as dotenv from 'dotenv';
import { IConfig } from '../types';
import { getEnv } from '../utils/env';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MEDIA_ROOT = getEnv('MEDIA_ROOT') || 'media/';

const PORT = parseInt(getEnv('PORT') || '3000', 10);

const config: IConfig = {
  NODE_ENV: getEnv('NODE_ENV', true),
  PORT,
  // Secret key used for hashing passwords and generating tokens
  SECRET_KEY: getEnv('SECRET_KEY', true),
  // Database connection options. See http://knexjs.org/#Installation-client
  POSTGRES_HOST: getEnv('POSTGRES_HOST') || 'localhost',
  POSTGRES_PORT: parseInt(getEnv('POSTGRES_PORT') || '5432', 10),
  POSTGRES_DB: getEnv('POSTGRES_DB') || 'contentjet-api',
  POSTGRES_USER: getEnv('POSTGRES_USER') || 'postgres',
  POSTGRES_PASSWORD: getEnv('POSTGRES_PASSWORD') || 'password',
  POSTGRES_POOL_MIN: parseInt(getEnv('POSTGRES_POOL_MIN') || '2', 10),
  POSTGRES_POOL_MAX: parseInt(getEnv('POSTGRES_POOL_MAX') || '10', 10),
  // The url where contentjet-ui is hosted
  FRONTEND_URL: getEnv('FRONTEND_URL') || 'http://localhost:9000',
  // The url where contentjet-api (this app) is hosted
  BACKEND_URL: getEnv('BACKEND_URL') || `http://localhost:${PORT}`,
  // The duration in seconds an authentication token (JWT) is valid for when authenticating
  // via the OAuth2 `Resource Owner Password Credentials Grant` flow. Default 5 mins.
  USER_TOKEN_EXPIRY: parseInt(getEnv('USER_TOKEN_EXPIRY') || '300', 10),
  // The duration in seconds an authentication token (JWT) is valid for when authenticating
  // via the OAuth2 `Client Credentials Grant` flow. Default 1 hour.
  CLIENT_TOKEN_EXPIRY: parseInt(getEnv('CLIENT_TOKEN_EXPIRY') || '3600', 10),
  // When false the user will receive a signup confirmation email. When true
  // the user will NOT receive a confirmation email and will have isActive = true
  // set immediately upon signup. Recommended this remains false in production.
  ACTIVE_ON_SIGNUP: !!parseInt(getEnv('ACTIVE_ON_SIGNUP') || '0', 10),
  // When true, stack traces will be logged.
  DEBUG: !!parseInt(getEnv('DEBUG') || '0', 10),
  // Cross-Origin Resource Sharing. See https://github.com/koajs/cors for options
  CORS_ORIGIN: getEnv('CORS_ORIGIN') || '*',
  // Email address used in the 'from' field of all email sent by this app
  MAIL_FROM: getEnv('MAIL_FROM', true),
  // Module path to storage backend
  STORAGE_BACKEND: getEnv('STORAGE_BACKEND') || './backends/storage/DiskStorageBackend',
  // File system path of storage directory. Required when storage backend is DiskStorageBackend.
  MEDIA_ROOT,
  // When true files in MEDIA_ROOT will served at the path /media.
  // Use in production is strongly discouraged.
  SERVE_MEDIA: !!parseInt(getEnv('SERVE_MEDIA') || '0', 10),
  // The URL uploaded media is served from
  MEDIA_URL: getEnv('MEDIA_URL') || 'http://localhost:3000/media/',
  // The dimensions of thumbnails created from uploaded images. Set values to 0
  // to disable thumbnail generation.
  THUMBNAIL_WIDTH: parseInt(getEnv('THUMBNAIL_WIDTH') || '200', 10),
  THUMBNAIL_HEIGHT: parseInt(getEnv('THUMBNAIL_HEIGHT') || '200', 10),
  // Module path to mail backend
  MAIL_BACKEND: getEnv('MAIL_BACKEND') || './backends/mail/SMTPBackend',
  // Whether or not to serve Swagger UI at /swagger endpoint. Defaults to true.
  SERVE_SWAGGER_UI: !!parseInt(getEnv('SERVE_SWAGGER_UI') || '1', 10)
};

export default config;
