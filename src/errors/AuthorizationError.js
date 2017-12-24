const BaseError = require('./BaseError');

class AuthorizationError extends BaseError {

  constructor(message = 'Permission denied') {
    super(message);
    this.name = 'AuthorizationError';
    this.status = 403;
  }

}

module.exports = AuthorizationError;
