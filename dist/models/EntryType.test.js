"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../app");
const Project_1 = require("./Project");
const EntryType_1 = require("./EntryType");
const User_1 = require("./User");
const lodash_1 = require("lodash");
const chai_1 = require("chai");
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
describe('EntryType', () => {
    let user1;
    let project1;
    let entryType1;
    beforeEach(async () => {
        await EntryType_1.default.deleteAll();
        await User_1.default.deleteAll();
        await Project_1.default.deleteAll();
        user1 = await User_1.default.create('user1@example.com', 'User1', '12345');
        project1 = await Project_1.default
            .query()
            .insert({
            name: 'Test Project 1',
            userId: user1.id
        });
        entryType1 = await EntryType_1.default
            .query()
            .insert({
            name: 'Test Entry Type',
            userId: user1.id,
            projectId: project1.id,
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
        });
    });
    afterEach(async () => {
        await EntryType_1.default.deleteAll();
        await User_1.default.deleteAll();
        await Project_1.default.deleteAll();
    });
    describe('#getById', async () => {
        it('gets an EntryType by id', async () => {
            const entryType = await EntryType_1.default.getById(entryType1.id);
            chai_1.assert.equal(lodash_1.get(entryType, 'id'), entryType1.id);
        });
    });
    describe('#existsInProject', async () => {
        it('EntryType exists in project', async () => {
            const exists = await EntryType_1.default.existsInProject(entryType1.id, project1.id);
            chai_1.assert.isTrue(exists);
        });
        it('EntryType does not exist in project', async () => {
            const exists = await EntryType_1.default.existsInProject(entryType1.id, 123);
            chai_1.assert.isFalse(exists);
        });
    });
    describe('#deleteAll', async () => {
        it('deletes all entry types', async () => {
            const numDeleted = await EntryType_1.default.deleteAll();
            chai_1.assert.equal(numDeleted, 1);
        });
    });
});
