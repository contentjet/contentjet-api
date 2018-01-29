import DiskStorageBackend from '../backends/storage/DiskStorageBackend';
import ModelPermissionBackend from '../backends/permissions/ModelPermissionBackend';
import ProjectPermissionBackend from '../backends/permissions/ProjectPermissionBackend';
import {get} from 'lodash';

const MEDIA_ROOT = get(process.env, 'MEDIA_ROOT', 'media/') as string;

export default {
  PORT: parseInt(get(process.env, 'PORT', '3000') as string),
  // Secret key used for hashing passwords and generating tokens
  SECRET_KEY: get(process.env, 'SECRET_KEY'),
  // Database connection options. See http://knexjs.org/#Installation-client
  DATABASE: {
    client: 'postgresql', // Do not change. Only postgres is supported.
    connection: {
      host: get(process.env, 'DB_HOST', 'localhost'),
      database: get(process.env, 'DB_NAME', 'contentjet-api'),
      user: get(process.env, 'DB_USER', 'postgres'),
      password: get(process.env, 'DB_PASSWORD', 'password')
    },
    pool: {
      min: parseInt(get(process.env, 'DB_POOL_MIN', '2') as string),
      max: parseInt(get(process.env, 'DB_POOL_MAX', '10') as string)
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },
  // The url where contentjet-ui is hosted
  FRONTEND_URL: get(process.env, 'FRONTEND_URL', 'http://localhost:9000'),
  // The duration in seconds an authentication token (JWT) is valid for
  TOKEN_EXPIRY: parseInt(get(process.env, 'TOKEN_EXPIRY') as string) || 3600,
  // When false the user will receive a signup confirmation email. When true
  // the user will NOT receive a confirmation email and will have isActive = true
  // set immediately upon signup. Recommended this remains false in production.
  ACTIVE_ON_SIGNUP: !!parseInt(get(process.env, 'ACTIVE_ON_SIGNUP', 0) as string),
  // When true, stack traces will be logged.
  DEBUG: !!parseInt(get(process.env, 'DEBUG', '0') as string),
  // Cross-Origin Resource Sharing. See https://github.com/koajs/cors for options
  CORS: {
    origin: get(process.env, 'CORS', '*')
  },
  // Email sending service
  MAIL_BACKEND: null,
  // Email address used in the 'from' field of all email sent by this app
  MAIL_FROM: get(process.env, 'MAIL_FROM', 'noreply@example.com'),
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
  SERVE_MEDIA: !!parseInt(get(process.env, 'SERVE_MEDIA', '0') as string),
  // The URL uploaded media is served from
  MEDIA_URL: get(process.env, 'MEDIA_URL', 'http://localhost:3000/media/'),
  // The dimensions of thumbnails created from uploaded images. Set values to 0
  // to disable thumbnail generation.
  THUMBNAIL: {
    width: parseInt(get(process.env, 'THUMBNAIL_WIDTH', '200') as string),
    height: parseInt(get(process.env, 'THUMBNAIL_HEIGHT', '200') as string)
  }
};
