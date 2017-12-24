const config = require('./config');

module.exports[process.env.NODE_ENV] = config.DATABASE;
