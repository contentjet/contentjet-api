const config = require('./config');

module.exports[process.env.NODE_ENV as string] = config.DATABASE;
