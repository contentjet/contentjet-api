"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../config");
const jwt = require("jsonwebtoken");
function generateAuthToken(payload) {
    return new Promise((resolve, reject) => {
        jwt.sign(payload, config_1.default.SECRET_KEY, { expiresIn: config_1.default.TOKEN_EXPIRY }, function (err, token) {
            if (err) {
                reject(err);
            }
            else {
                resolve({
                    'access_token': token,
                    'token_type': 'bearer',
                    'expires_in': config_1.default.TOKEN_EXPIRY,
                    'refresh_token': token
                });
            }
        });
    });
}
exports.generateAuthToken = generateAuthToken;
function verifyAuthToken(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, config_1.default.SECRET_KEY, function (err, payload) {
            if (err) {
                reject(err);
            }
            else {
                resolve(payload);
            }
        });
    });
}
exports.verifyAuthToken = verifyAuthToken;
async function refreshAuthToken(token) {
    const payload = await verifyAuthToken(token);
    return await generateAuthToken({ userId: payload.userId });
}
exports.refreshAuthToken = refreshAuthToken;
