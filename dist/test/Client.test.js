"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../server");
const config_1 = require("../config");
const User_1 = require("../models/User");
const Client_1 = require("../models/Client");
const Project_1 = require("../models/Project");
const chai_1 = require("chai");
const axios_1 = require("axios");
const BASE_URL = `http://localhost:${config_1.default.PORT}/`;
describe('Client - Integration', function () {
    let client;
    let token;
    let user1;
    let project1;
    before(async function () {
        user1 = await User_1.default.create('user1@example.com', 'User1', '123456', true);
        project1 = await Project_1.default
            .query()
            .insert({
            name: 'Test Project 1',
            userId: user1.id
        });
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
    after(async function () {
        await Project_1.default.deleteAll();
        await User_1.default.deleteAll();
    });
    describe('#create', async function () {
        afterEach(async function () {
            await Client_1.default.deleteAll();
        });
        it('creates a client', async function () {
            const data = {
                name: 'Test client'
            };
            const response = await client.post(`project/${project1.id}/client/`, data);
            chai_1.assert.equal(response.status, 201);
            chai_1.assert.equal(response.data.name, 'Test client');
            chai_1.assert.lengthOf(response.data.clientId, 32);
            chai_1.assert.lengthOf(response.data.clientSecret, 32);
        });
    });
    describe('#authenticate', async function () {
        let client;
        before(async function () {
            client = await Client_1.default.create(project1.id, 'Test client');
        });
        afterEach(async function () {
            await Client_1.default.deleteAll();
        });
        it('authenticates a client', async function () {
            const data = {
                client_id: client.clientId,
                client_secret: client.clientSecret,
                grant_type: 'client_credentials'
            };
            const response = await axios_1.default.post(`${BASE_URL}project/${project1.id}/client/authenticate`, data);
            chai_1.assert.equal(response.status, 200);
            chai_1.assert.exists(response.data.access_token);
            chai_1.assert.exists(response.data.expires_in);
            chai_1.assert.equal(response.data.token_type, 'bearer');
        });
    });
});
