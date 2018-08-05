"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
module.exports[config_1.default.NODE_ENV] = {
    client: 'postgresql',
    connection: {
        host: config_1.default.POSTGRES_HOST,
        port: config_1.default.POSTGRES_PORT,
        database: config_1.default.POSTGRES_DB,
        user: config_1.default.POSTGRES_USER,
        password: config_1.default.POSTGRES_PASSWORD
    },
    pool: {
        min: config_1.default.POSTGRES_POOL_MIN,
        max: config_1.default.POSTGRES_POOL_MAX
    },
    migrations: {
        tableName: 'knex_migrations'
    }
};
