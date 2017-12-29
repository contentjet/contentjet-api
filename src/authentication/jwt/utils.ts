const config = require('../../config');
import * as jwt from 'jsonwebtoken';

export function generateAuthToken(payload: string | object | Buffer): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, config.SECRET_KEY, {expiresIn: config.TOKEN_EXPIRY}, function (err, token) {
      if (err) {
        reject(err);
      } else {
        resolve({
          'access_token': token,
          'token_type': 'bearer',
          'expires_in': config.TOKEN_EXPIRY,
          'refresh_token': token
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

export async function refreshAuthToken(token: string) {
  const payload = await verifyAuthToken(token);
  return await generateAuthToken({userId: payload.userId});
}
