"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../server");
const config_1 = require("../config");
const User_1 = require("../models/User");
const Project_1 = require("../models/Project");
const chai_1 = require("chai");
const axios_1 = require("axios");
const BASE_URL = `http://localhost:${config_1.default.PORT}/`;
describe('Project - Integration', function () {
    let client;
    let token;
    describe('#create project (non-admin)', async function () {
        before(async function () {
            // Create a non-admin user and login
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
        after(async function () {
            await User_1.default.deleteAll();
            await Project_1.default.deleteAll();
        });
        it('fails as user is not an admin', async function () {
            try {
                var response = await client.post('project/', {
                    name: 'My Project'
                });
            }
            catch (err) {
                chai_1.assert.equal(err.response.status, 403);
                return;
            }
            chai_1.assert.equal(response.status, 403);
        });
    });
});
