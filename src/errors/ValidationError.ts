import BaseError from './BaseError';

class ValidationError extends BaseError {

  errors?: object;

  constructor(message = 'A validation error occurred') {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }

  toJSON() {
    const json = super.toJSON() as any;
    json.errors = this.errors;
    return json;
  }

}

export default ValidationError;
