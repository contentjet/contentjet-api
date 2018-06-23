"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../app");
const Project_1 = require("./Project");
const User_1 = require("./User");
const chai_1 = require("chai");
const Client_1 = require("./Client");
describe('Client', () => {
    let user1;
    let project1;
    beforeEach(async () => {
        await User_1.default.deleteAll();
        await Project_1.default.deleteAll();
        user1 = await User_1.default.create('user1@example.com', 'User1', '12345');
        project1 = await Project_1.default
            .query()
            .insert({ name: 'Test Project 1', userId: user1.id });
    });
    afterEach(async () => {
        await User_1.default.deleteAll();
        await Project_1.default.deleteAll();
    });
    describe('#create', async () => {
        afterEach(async () => {
            await Client_1.default.deleteAll();
        });
        it('creates a client for a project', async () => {
            const client = await Client_1.default.create(project1.id, 'Test Client');
            chai_1.assert.equal(client.name, 'Test Client');
            chai_1.assert.lengthOf(client.clientId, 32);
            chai_1.assert.lengthOf(client.clientSecret, 32);
        });
    });
});
