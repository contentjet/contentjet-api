"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const DiskStorageBackend_1 = require("../backends/storage/DiskStorageBackend");
const ModelPermissionBackend_1 = require("../backends/permissions/ModelPermissionBackend");
const ProjectPermissionBackend_1 = require("../backends/permissions/ProjectPermissionBackend");
const MailGunBackend_1 = require("../backends/mail/MailGunBackend");
const SMTPBackend_1 = require("../backends/mail/SMTPBackend");
const lodash_1 = require("lodash");
function env(name, required = false) {
    const value = lodash_1.get(process.env, name);
    if (!value && required)
        throw new Error(`Invalid config: ${name} must be set`);
    return value;
}
;
const MEDIA_ROOT = env('MEDIA_ROOT') || 'media/';
const PORT = parseInt(env('PORT') || '3000');
const config = {
    NODE_ENV: env('NODE_ENV', true),
    PORT: PORT,
    // Secret key used for hashing passwords and generating tokens
    SECRET_KEY: env('SECRET_KEY', true),
    // Database connection options. See http://knexjs.org/#Installation-client
    DATABASE: {
        client: 'postgresql',
        connection: {
            host: env('DB_HOST') || 'localhost',
            port: parseInt(env('DB_PORT') || '5432'),
            database: env('DB_NAME') || 'contentjet-api',
            user: env('DB_USER') || 'postgres',
            password: env('DB_PASS') || 'password'
        },
        pool: {
            min: parseInt(env('DB_POOL_MIN') || '2'),
            max: parseInt(env('DB_POOL_MAX') || '10')
        },
        migrations: {
            tableName: 'knex_migrations'
        }
    },
    // The url where contentjet-ui is hosted
    FRONTEND_URL: env('FRONTEND_URL') || 'http://localhost:9000',
    // The url where contentjet-api (this app) is hosted
    BACKEND_URL: env('BACKEND_URL') || `http://localhost:${PORT}`,
    // The duration in seconds an authentication token (JWT) is valid for
    TOKEN_EXPIRY: parseInt(env('TOKEN_EXPIRY') || '3000'),
    // When false the user will receive a signup confirmation email. When true
    // the user will NOT receive a confirmation email and will have isActive = true
    // set immediately upon signup. Recommended this remains false in production.
    ACTIVE_ON_SIGNUP: !!parseInt(env('ACTIVE_ON_SIGNUP') || '0'),
    // When true, stack traces will be logged.
    DEBUG: !!parseInt(env('DEBUG') || '0'),
    // Cross-Origin Resource Sharing. See https://github.com/koajs/cors for options
    CORS: {
        origin: env('CORS') || '*'
    },
    // Email sending service
    MAIL_BACKEND: null,
    // Email address used in the 'from' field of all email sent by this app
    MAIL_FROM: env('MAIL_FROM', true),
    PERMISSION_BACKENDS: [
        new ModelPermissionBackend_1.default(),
        new ProjectPermissionBackend_1.default()
    ],
    // File storage service
    STORAGE_BACKEND: new DiskStorageBackend_1.default(MEDIA_ROOT),
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
    }
};
// Instantiate the mail backend
const mailBackend = env('MAIL_BACKEND', true);
if (mailBackend === 'mailgun') {
    const apiKey = env('MAILGUN_API_KEY', true);
    const domain = env('MAILGUN_DOMAIN', true);
    config.MAIL_BACKEND = new MailGunBackend_1.default(apiKey, domain);
}
else if (mailBackend === 'smtp') {
    const options = {
        host: env('SMTP_HOST', true),
        port: env('SMTP_PORT', true),
        auth: {
            user: env('SMTP_AUTH_USER', true),
            pass: env('SMTP_AUTH_PASS', true)
        },
        secure: !!parseInt(env('SMTP_SECURE') || '0')
    };
    config.MAIL_BACKEND = new SMTPBackend_1.default(options);
}
else {
    throw new Error('Invalid config. MAIL_BACKEND is invalid. Must be \'mailgun\' or \'smtp\'.');
}
exports.default = config;
