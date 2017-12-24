const BaseError = require('./BaseError');

class ValidationError extends BaseError {

  constructor(message = 'A validation error occurred') {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }

  toJSON() {
    let json = super.toJSON();
    json.errors = this.errors;
    return json;
  }

}

module.exports = ValidationError;
