abstract class BaseError extends Error {

  name!: string;
  message!: string;
  status!: number;
  expose: boolean;

  constructor(message: string) {
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

export default BaseError;
