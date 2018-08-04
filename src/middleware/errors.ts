import * as Koa from 'koa';
import { ValidationError as ObjectionValidationError } from 'objection';
import NotFoundError from '../errors/NotFoundError';
import ValidationError from '../errors/ValidationError';
import AuthenticationError from '../errors/AuthenticationError';
import * as jwt from 'jsonwebtoken';
import config from '../config';

export default async (ctx: Koa.Context, next: () => Promise<any>) => {
  try {
    await next();
    // Catch Koa's stadard 404 response and throw our own error
    if (ctx.response.status === 404) throw new NotFoundError();
  } catch (err) {
    if (err instanceof ObjectionValidationError) {
      const e = new ValidationError();
      e.errors = err.data;
      ctx.body = e;
      ctx.status = e.status;
    } else if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
      const e = new AuthenticationError(err.message);
      ctx.body = e;
      ctx.status = e.status;
    } else {
      ctx.status = err.status || err.statusCode || 500;
      ctx.body = err;
    }
    // tslint:disable-next-line
    if (config.DEBUG) console.log(err.stack);
  }
};
