import BaseError from './BaseError';

class NotFoundError extends BaseError {

  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }

}

export default NotFoundError;
