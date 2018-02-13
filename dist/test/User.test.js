"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../server");
const config_1 = require("../config");
const User_1 = require("../models/User");
const chai_1 = require("chai");
const axios_1 = require("axios");
const BASE_URL = `http://localhost:${config_1.default.PORT}/`;
describe('User - Integration', function () {
    let client;
    let token;
    beforeEach(async function () {
        await User_1.default.create('user1@example.com', 'User1', '123456', true);
        const loginResponse = await axios_1.default
            .post(`${BASE_URL}user/authenticate`, {
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
    afterEach(async function () {
        await User_1.default.deleteAll();
    });
    describe('#change-password', async function () {
        it('changes the authenticated user\'s password', async function () {
            const response = await client.post('user/change-password/', {
                password: '123456',
                newPassword: 'mynewpassword'
            });
            chai_1.assert.equal(response.status, 200);
            const loginResponse = await axios_1.default
                .post(`${BASE_URL}user/authenticate`, {
                username: 'user1@example.com',
                password: 'mynewpassword',
                grant_type: 'password'
            });
            chai_1.assert.equal(loginResponse.status, 200);
        });
        it('fails to change the authenticated user\'s password because it\'s too short', async function () {
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
        it('fails to change the authenticated user\'s password because current password is wrong', async function () {
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
});
