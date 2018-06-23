"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../server");
const config_1 = require("../config");
const Project_1 = require("../models/Project");
const EntryType_1 = require("../models/EntryType");
const User_1 = require("../models/User");
const chai_1 = require("chai");
const axios_1 = require("axios");
const lodash_1 = require("lodash");
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
const booleanField = {
    name: 'testBooleanField',
    label: 'Test boolean field',
    description: '',
    required: false,
    disabled: false,
    fieldType: 'BOOLEAN',
    labelTrue: 'Yes',
    labelFalse: 'No'
};
const numberField = {
    name: 'testNumberField',
    label: 'Test number field',
    description: '',
    required: false,
    disabled: false,
    fieldType: 'NUMBER',
    minValue: -99999,
    maxValue: 99999,
    format: 'integer'
};
const dateField = {
    name: 'testDateField',
    label: 'Test date field',
    description: '',
    required: false,
    disabled: false,
    fieldType: 'DATE',
    format: 'datetime'
};
const choiceField = {
    name: 'choiceField',
    label: 'Test choice field',
    description: '',
    required: false,
    disabled: false,
    fieldType: 'CHOICE',
    choices: [
        'foo',
        'bar',
        'eggs',
        'spam'
    ],
    format: 'single'
};
const colorField = {
    name: 'colorField',
    label: 'Test color field',
    description: '',
    required: false,
    disabled: false,
    fieldType: 'COLOR',
    format: 'rgb'
};
const listField = {
    name: 'listField',
    label: 'Test list field',
    description: '',
    required: false,
    disabled: false,
    fieldType: 'LIST',
    minLength: 0,
    maxLength: 999
};
const validEntryTypeData = {
    name: 'Test Entry Type',
    description: 'Just a test entry type',
    metadata: '',
    fields: [
        textField,
        longTextField,
        booleanField,
        numberField,
        dateField,
        choiceField,
        colorField,
        listField
    ]
};
describe('EntryType - Integration', () => {
    let client;
    let user1;
    let project1;
    let token;
    beforeEach(async () => {
        await EntryType_1.default.deleteAll();
        await User_1.default.deleteAll();
        await Project_1.default.deleteAll();
        user1 = await User_1.default.create('user1@example.com', 'User1', '12345', true);
        project1 = await Project_1.default
            .query()
            .insert({
            name: 'Test Project 1',
            userId: user1.id
        });
        const loginResponse = await axios_1.default
            .post(`${BASE_URL}authenticate`, {
            username: 'user1@example.com',
            password: '12345',
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
        await EntryType_1.default.deleteAll();
        await User_1.default.deleteAll();
        await Project_1.default.deleteAll();
    });
    describe('#create', async () => {
        it('creates an EntryType', async () => {
            const response = await client.post(`project/${project1.id}/entry-type/`, validEntryTypeData);
            chai_1.assert.equal(response.status, 201);
            chai_1.assert.lengthOf(response.data.fields, validEntryTypeData.fields.length);
        });
        it('creates an EntryType ignoring extra fields', async () => {
            const data = lodash_1.cloneDeep(validEntryTypeData);
            // Assuming the data is valid, any extra fields should be ignored
            data.someUnexpectedField = 'blah';
            const response = await client.post(`project/${project1.id}/entry-type/`, data);
            chai_1.assert.equal(response.status, 201);
        });
    });
});
