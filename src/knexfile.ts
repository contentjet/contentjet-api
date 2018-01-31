import config from './config';

module.exports[config.NODE_ENV as string] = config.DATABASE;
