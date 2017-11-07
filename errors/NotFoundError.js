const BaseError = require('./BaseError');

class NotFoundError extends BaseError {

  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }

}

module.exports = NotFoundError;
