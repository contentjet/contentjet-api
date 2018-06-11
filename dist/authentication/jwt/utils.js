"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../config");
const jwt = require("jsonwebtoken");
const ValidationError_1 = require("../../errors/ValidationError");
function generateUserAuthToken(payload) {
    return new Promise((resolve, reject) => {
        jwt.sign(payload, config_1.default.SECRET_KEY, { expiresIn: config_1.default.USER_TOKEN_EXPIRY }, function (err, token) {
            if (err) {
                reject(err);
            }
            else {
                resolve({
                    'access_token': token,
                    'token_type': 'bearer',
                    'expires_in': config_1.default.USER_TOKEN_EXPIRY,
                    'refresh_token': token
                });
            }
        });
    });
}
exports.generateUserAuthToken = generateUserAuthToken;
function generateClientAuthToken(payload) {
    return new Promise((resolve, reject) => {
        jwt.sign(payload, config_1.default.SECRET_KEY, { expiresIn: config_1.default.CLIENT_TOKEN_EXPIRY }, function (err, token) {
            if (err) {
                reject(err);
            }
            else {
                resolve({
                    'access_token': token,
                    'token_type': 'bearer',
                    'expires_in': config_1.default.CLIENT_TOKEN_EXPIRY
                });
            }
        });
    });
}
exports.generateClientAuthToken = generateClientAuthToken;
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
async function refreshUserAuthToken(token) {
    const payload = await verifyAuthToken(token);
    if (!payload.userId)
        throw new ValidationError_1.default('Invalid refresh token');
    return await generateUserAuthToken({ userId: payload.userId });
}
exports.refreshUserAuthToken = refreshUserAuthToken;
