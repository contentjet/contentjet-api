import BaseError from './BaseError';

class AuthorizationError extends BaseError {

  constructor(message = 'Permission denied') {
    super(message);
    this.name = 'AuthorizationError';
    this.status = 403;
  }

}

export default AuthorizationError;
