import config from './config';

module.exports[config.NODE_ENV as string] = {
  client: 'postgresql',
  connection: {
    host: config.POSTGRES_HOST,
    port: config.POSTGRES_PORT,
    database: config.POSTGRES_DB,
    user: config.POSTGRES_USER,
    password: config.POSTGRES_PASSWORD
  },
  pool: {
    min: config.POSTGRES_POOL_MIN,
    max: config.POSTGRES_POOL_MAX
  },
  migrations: {
    tableName: 'knex_migrations'
  }
};
