class BaseError extends Error {

  constructor(message) {
    super(message);
    this.expose = true;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status
    };
  }

}

module.exports = BaseError;
