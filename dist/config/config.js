"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DiskStorageBackend_1 = require("../backends/storage/DiskStorageBackend");
const ModelPermissionBackend_1 = require("../backends/permissions/ModelPermissionBackend");
const ProjectPermissionBackend_1 = require("../backends/permissions/ProjectPermissionBackend");
const MEDIA_ROOT = 'media/';
exports.default = {
    PORT: 3000,
    // Secret key used for hashing passwords and generating tokens
    SECRET_KEY: null,
    // Database connection options. See http://knexjs.org/#Installation-client
    DATABASE: {
        client: 'postgresql',
        connection: {
            host: 'localhost',
            database: 'contentjet-api',
            user: 'postgres',
            password: 'password'
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: 'knex_migrations'
        }
    },
    // The url where contentjet-ui is hosted
    FRONTEND_URL: 'http://localhost:9000',
    // The duration in seconds an authentication token (JWT) is valid for
    TOKEN_EXPIRY: 3600,
    // When false the user will receive a signup confirmation email. When true
    // the user will NOT receive a confirmation email and will have isActive = true
    // set immediately upon signup. Recommended this remains false in production.
    ACTIVE_ON_SIGNUP: false,
    // When true, stack traces will be logged.
    DEBUG: false,
    // Cross-Origin Resource Sharing. See https://github.com/koajs/cors for options
    CORS: {
        origin: '*'
    },
    // Email sending service
    MAIL_BACKEND: null,
    // Email address used in the 'from' field of all email sent by this app
    MAIL_FROM: 'noreply@example.com',
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
    SERVE_MEDIA: false,
    // The URL uploaded media is served from
    MEDIA_URL: 'http://localhost:3000/media/',
    // The dimensions of thumbnails created from uploaded images. Set values to 0
    // to disable thumbnail generation.
    THUMBNAIL: {
        width: 200,
        height: 200
    }
};
