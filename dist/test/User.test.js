"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../server");
const config_1 = require("../config");
const User_1 = require("../models/User");
const chai_1 = require("chai");
const axios_1 = require("axios");
const BASE_URL = `http://localhost:${config_1.default.PORT}/`;
describe('User - Integration', () => {
    let client;
    let token;
    beforeEach(async () => {
        await User_1.default.create('user1@example.com', 'User1', '123456', true);
        const loginResponse = await axios_1.default
            .post(`${BASE_URL}authenticate`, {
            username: 'user1@example.com',
            password: '123456',
            grant_type: 'password'
        });
        token = loginResponse.data.access_token;
        client = axios_1.default.create({
            baseURL: BASE_URL,
            headers: {
                'Content-Type': `application/json`,
                'Authorization': `Bearer ${token}`
            }
        });
    });
    afterEach(async () => {
        await User_1.default.deleteAll();
    });
    describe('#change-password', async () => {
        it('changes the authenticated user\'s password', async () => {
            const response = await client.post('user/change-password/', {
                password: '123456',
                newPassword: 'mynewpassword'
            });
            chai_1.assert.equal(response.status, 200);
            const loginResponse = await axios_1.default
                .post(`${BASE_URL}authenticate`, {
                username: 'user1@example.com',
                password: 'mynewpassword',
                grant_type: 'password'
            });
            chai_1.assert.equal(loginResponse.status, 200);
        });
        it('fails to change the authenticated user\'s password because it\'s too short', async () => {
            try {
                await client.post('user/change-password/', {
                    password: '123456',
                    newPassword: 'x'
                });
            }
            catch (err) {
                chai_1.assert.equal(err.response.status, 400);
            }
        });
        it('fails to change the authenticated user\'s password because current password is wrong', async () => {
            try {
                await client.post('user/change-password/', {
                    password: 'wrongpassword',
                    newPassword: 'mynewpassword'
                });
            }
            catch (err) {
                chai_1.assert.equal(err.response.status, 400);
            }
        });
    });
    describe('#authenticate', async () => {
        it('fails to authenticate with wrong grant_type', async () => {
            let loginResponse;
            try {
                // Note we're not using the axios client created in the beforeEach hook.
                loginResponse = await axios_1.default
                    .post(`${BASE_URL}authenticate`, {
                    username: 'user1@example.com',
                    password: '123456',
                    grant_type: 'blahblah'
                });
            }
            catch (err) {
                chai_1.assert.equal(err.response.status, 400);
                return;
            }
            chai_1.assert.notEqual(loginResponse.status, 200);
        });
        it('fails to refresh token with wrong grant_type', async () => {
            const loginResponse = await axios_1.default
                .post(`${BASE_URL}authenticate`, {
                username: 'user1@example.com',
                password: '123456',
                grant_type: 'password'
            });
            const accessToken = loginResponse.data.access_token;
            const refreshToken = loginResponse.data.refresh_token;
            let refreshResponse;
            try {
                refreshResponse = await axios_1.default
                    .post(`${BASE_URL}token-refresh`, {
                    refresh_token: refreshToken,
                    grant_type: 'blahblah'
                }, {
                    headers: {
                        'Content-Type': `application/json`,
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
            }
            catch (err) {
                chai_1.assert.equal(err.response.status, 400);
                return;
            }
            chai_1.assert.notEqual(refreshResponse.status, 200);
        });
    });
});
