import BaseError from './BaseError';

class DatabaseError extends BaseError {

  constructor(message = 'A database error occurred') {
    super(message);
    this.name = 'DatabaseError';
    this.status = 500;
  }

}

export default DatabaseError;
