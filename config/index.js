const _ = require('lodash');

let environmentConfig = null;
if (process.env.NODE_ENV) {
  try {
    environmentConfig = require(`./config.${process.env.NODE_ENV}`);
  } catch (err) {
    // Fail silently
  }
}

const config = _.merge(require('./config'), environmentConfig);

if (!config.SECRET_KEY) throw new Error('Invalid config. SECRET_KEY must be set.');

module.exports = config;
