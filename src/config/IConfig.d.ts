import IPermissionBackend from '../backends/permissions/IPermissionBackend';
import IStorageBackend from '../backends/storage/IStorageBackend';
import IMailBackend from '../backends/mail/IMailBackend';

export default interface IConfig {
  NODE_ENV: string,
  PORT: number,
  SECRET_KEY: string,
  DATABASE: {
    client: string,
    connection: {
      host: string,
      port: number,
      database: string,
      user: string,
      password: string
    },
    pool: {
      min: number,
      max: number
    },
    migrations: {
      tableName: string
    }
  },
  FRONTEND_URL: string,
  BACKEND_URL: string,
  USER_TOKEN_EXPIRY: number,
  CLIENT_TOKEN_EXPIRY: number,
  ACTIVE_ON_SIGNUP: boolean,
  DEBUG: boolean,
  CORS: {
    origin: string
  },
  MAIL_FROM: string,
  PERMISSION_BACKENDS: IPermissionBackend[],
  STORAGE_BACKEND: IStorageBackend,
  MEDIA_ROOT: string,
  SERVE_MEDIA: boolean,
  MEDIA_URL: string,
  THUMBNAIL: {
    width: number,
    height: number
  },
  MAIL_BACKEND: IMailBackend,
  SERVE_SWAGGER_UI: boolean
}
