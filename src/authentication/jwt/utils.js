const config = require('../../config');
const jwt = require('jsonwebtoken');

function generateAuthToken(payload) {
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

function verifyAuthToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.SECRET_KEY, function (err, payload) {
      if (err) {
        reject(err);
      } else {
        resolve(payload);
      }
    });
  });
}

async function refreshAuthToken(token) {
  const payload = await verifyAuthToken(token);
  return await generateAuthToken({userId: payload.userId});
}

module.exports = {
  generateAuthToken,
  verifyAuthToken,
  refreshAuthToken
};
