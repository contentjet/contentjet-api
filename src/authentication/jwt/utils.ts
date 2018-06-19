import config from '../../config';
import * as jwt from 'jsonwebtoken';
import ValidationError from '../../errors/ValidationError';

export function generateUserAuthToken(payload: string | object | Buffer): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, config.SECRET_KEY, { expiresIn: config.USER_TOKEN_EXPIRY }, function (err, token) {
      if (err) {
        reject(err);
      } else {
        resolve({
          'access_token': token,
          'token_type': 'bearer',
          'expires_in': config.USER_TOKEN_EXPIRY,
          'refresh_token': token
        });
      }
    });
  });
}

export function generateClientAuthToken(payload: string | object | Buffer): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, config.SECRET_KEY, { expiresIn: config.CLIENT_TOKEN_EXPIRY }, function (err, token) {
      if (err) {
        reject(err);
      } else {
        resolve({
          'access_token': token,
          'token_type': 'bearer',
          'expires_in': config.CLIENT_TOKEN_EXPIRY
        });
      }
    });
  });
}

export function verifyAuthToken(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.SECRET_KEY, function (err: any, payload: any) {
      if (err) {
        reject(err);
      } else {
        resolve(payload);
      }
    });
  });
}

export async function refreshUserAuthToken(token: string) {
  const payload = await verifyAuthToken(token);
  if (!payload.userId) throw new ValidationError('Invalid refresh token');
  return await generateUserAuthToken({ userId: payload.userId });
}
