"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const dotenv = require("dotenv");
const env_1 = require("../utils/env");
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const MEDIA_ROOT = env_1.getEnv('MEDIA_ROOT') || 'media/';
const PORT = parseInt(env_1.getEnv('PORT') || '3000', 10);
const config = {
    NODE_ENV: env_1.getEnv('NODE_ENV', true),
    PORT,
    // Secret key used for hashing passwords and generating tokens
    SECRET_KEY: env_1.getEnv('SECRET_KEY', true),
    // Database connection options. See http://knexjs.org/#Installation-client
    POSTGRES_HOST: env_1.getEnv('POSTGRES_HOST') || 'localhost',
    POSTGRES_PORT: parseInt(env_1.getEnv('POSTGRES_PORT') || '5432', 10),
    POSTGRES_DB: env_1.getEnv('POSTGRES_DB') || 'contentjet-api',
    POSTGRES_USER: env_1.getEnv('POSTGRES_USER') || 'postgres',
    POSTGRES_PASSWORD: env_1.getEnv('POSTGRES_PASSWORD') || 'password',
    POSTGRES_POOL_MIN: parseInt(env_1.getEnv('POSTGRES_POOL_MIN') || '2', 10),
    POSTGRES_POOL_MAX: parseInt(env_1.getEnv('POSTGRES_POOL_MAX') || '10', 10),
    // The url where contentjet-ui is hosted
    FRONTEND_URL: env_1.getEnv('FRONTEND_URL') || 'http://localhost:9000',
    // The url where contentjet-api (this app) is hosted
    BACKEND_URL: env_1.getEnv('BACKEND_URL') || `http://localhost:${PORT}`,
    // The duration in seconds an authentication token (JWT) is valid for when authenticating
    // via the OAuth2 `Resource Owner Password Credentials Grant` flow. Default 5 mins.
    USER_TOKEN_EXPIRY: parseInt(env_1.getEnv('USER_TOKEN_EXPIRY') || '300', 10),
    // The duration in seconds an authentication token (JWT) is valid for when authenticating
    // via the OAuth2 `Client Credentials Grant` flow. Default 1 hour.
    CLIENT_TOKEN_EXPIRY: parseInt(env_1.getEnv('CLIENT_TOKEN_EXPIRY') || '3600', 10),
    // When false the user will receive a signup confirmation email. When true
    // the user will NOT receive a confirmation email and will have isActive = true
    // set immediately upon signup. Recommended this remains false in production.
    ACTIVE_ON_SIGNUP: !!parseInt(env_1.getEnv('ACTIVE_ON_SIGNUP') || '0', 10),
    // When true, stack traces will be logged.
    DEBUG: !!parseInt(env_1.getEnv('DEBUG') || '0', 10),
    // Cross-Origin Resource Sharing. See https://github.com/koajs/cors for options
    CORS_ORIGIN: env_1.getEnv('CORS_ORIGIN') || '*',
    // Email address used in the 'from' field of all email sent by this app
    MAIL_FROM: env_1.getEnv('MAIL_FROM', true),
    // Module path to storage backend
    STORAGE_BACKEND: env_1.getEnv('STORAGE_BACKEND') || './backends/storage/DiskStorageBackend',
    // File system path of storage directory. Required when storage backend is DiskStorageBackend.
    MEDIA_ROOT,
    // When true files in MEDIA_ROOT will served at the path /media.
    // Use in production is strongly discouraged.
    SERVE_MEDIA: !!parseInt(env_1.getEnv('SERVE_MEDIA') || '0', 10),
    // The URL uploaded media is served from
    MEDIA_URL: env_1.getEnv('MEDIA_URL') || 'http://localhost:3000/media/',
    // The dimensions of thumbnails created from uploaded images. Set values to 0
    // to disable thumbnail generation.
    THUMBNAIL_WIDTH: parseInt(env_1.getEnv('THUMBNAIL_WIDTH') || '200', 10),
    THUMBNAIL_HEIGHT: parseInt(env_1.getEnv('THUMBNAIL_HEIGHT') || '200', 10),
    // Module path to mail backend
    MAIL_BACKEND: env_1.getEnv('MAIL_BACKEND') || './backends/mail/SMTPBackend',
    // Whether or not to serve Swagger UI at /swagger endpoint. Defaults to true.
    SERVE_SWAGGER_UI: !!parseInt(env_1.getEnv('SERVE_SWAGGER_UI') || '1', 10)
};
exports.default = config;
