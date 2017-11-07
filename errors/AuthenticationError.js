const BaseError = require('./BaseError');

class AuthenticationError extends BaseError {

  constructor(message = 'An authentication error occurred') {
    super(message);
    this.name = 'AuthenticationError';
    this.status = 401;
  }

}

module.exports = AuthenticationError;
