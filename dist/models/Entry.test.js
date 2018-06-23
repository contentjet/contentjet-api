"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../app");
const Project_1 = require("./Project");
const Entry_1 = require("./Entry");
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
describe('Entry', () => {
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
        await Entry_1.default.deleteAll();
        await EntryType_1.default.deleteAll();
    });
    describe('#bulkDelete', async () => {
        beforeEach(async () => {
            const entryType = await EntryType_1.default
                .query()
                .insert({
                name: 'Test Entry Type',
                userId: user1.id,
                projectId: project1.id,
                fields: [
                    textField
                ]
            });
            await Promise.all(lodash_1.range(5).map(async (i) => {
                return await Entry_1.default
                    .query()
                    .insert({
                    name: 'Test Entry' + i,
                    userId: user1.id,
                    modifiedByUserId: user1.id,
                    entryTypeId: entryType.id,
                    published: '2015-01-01T00:00:00Z',
                    fields: [
                        {
                            name: 'testTextField',
                            value: 'Lorem ipsum dolar sit amet',
                            fieldType: 'TEXT'
                        }
                    ]
                });
            }));
        });
        afterEach(async () => {
            await Entry_1.default.deleteAll();
            await EntryType_1.default.deleteAll();
        });
        it('bulk deletes 3 entries', async () => {
            let entries = await Entry_1.default.query();
            chai_1.assert.lengthOf(entries, 5);
            const entryIds = entries.map(entry => entry.id);
            const entryIdsToDelete = lodash_1.slice(entryIds, 0, 3);
            await Entry_1.default.bulkDelete(entryIdsToDelete, project1.id);
            entries = await Entry_1.default.query();
            chai_1.assert.lengthOf(entries, 2);
        });
    });
});
