"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../server");
const config_1 = require("../config");
const User_1 = require("../models/User");
const Entry_1 = require("../models/Entry");
const EntryType_1 = require("../models/EntryType");
const Project_1 = require("../models/Project");
const _ = require("lodash");
const chai_1 = require("chai");
const axios_1 = require("axios");
const BASE_URL = `http://localhost:${config_1.default.PORT}/`;
const textField = {
    name: 'testTextField',
    label: 'Test text field',
    description: '',
    required: false,
    disabled: false,
    fieldType: 'TEXT',
    minLength: 1,
    maxLength: 100,
    format: 'plaintext'
};
const longTextField = {
    name: 'testLongTextField',
    label: 'Test long text field',
    description: '',
    required: false,
    disabled: false,
    fieldType: 'LONGTEXT',
    minLength: 1,
    maxLength: 30000,
    format: 'plaintext'
};
const validEntryTypeData = {
    name: 'Test Entry Type',
    description: 'Just a test entry type',
    metadata: '',
    fields: [
        textField,
        longTextField
    ]
};
const validEntryData = {
    entryTypeId: null,
    name: 'Test Entry',
    published: '1970-01-01T00:00:00Z',
    tags: [],
    fields: {
        testTextField: 'Hello',
        testLongTextField: 'World'
    }
};
describe('Entry - Integration', () => {
    let client;
    let token;
    let user1;
    let project1;
    before(async () => {
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
    after(async () => {
        await User_1.default.deleteAll();
        await Entry_1.default.deleteAll();
        await EntryType_1.default.deleteAll();
    });
    describe('#update', async () => {
        let entryTypeId;
        let entryId;
        beforeEach(async () => {
            // Create entry type
            const entryTypeResponse = await client.post(`project/${project1.id}/entry-type/`, validEntryTypeData);
            entryTypeId = entryTypeResponse.data.id;
            // Create entry
            const data = _.cloneDeep(validEntryData);
            data.entryTypeId = entryTypeId;
            const entryResponse = await client.post(`project/${project1.id}/entry/`, data);
            entryId = entryResponse.data.id;
        });
        afterEach(async () => {
            await Entry_1.default.deleteAll();
            await EntryType_1.default.deleteAll();
        });
        it('updates an entry\'s field', async () => {
            const data = _.cloneDeep(validEntryData);
            data.userId = user1.id;
            data.entryTypeId = entryTypeId;
            data.fields.testTextField = 'This is new!';
            const response = await client.put(`project/${project1.id}/entry/${entryId}`, data);
            chai_1.assert.equal(response.status, 200);
            chai_1.assert.equal(response.data.fields.testTextField, 'This is new!');
        });
    });
});
