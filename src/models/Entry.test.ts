import '../app';
import Project from './Project';
import Entry from './Entry';
import EntryType from './EntryType';
import User from './User';
import { range, slice } from 'lodash';
import { assert } from 'chai';

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

  let user1: User;
  let project1: Project;

  beforeEach(async () => {
    await User.deleteAll();
    await Project.deleteAll();
    user1 = await User.create('user1@example.com', 'User1', '12345');
    project1 = await Project
      .query()
      .insert({ name: 'Test Project 1', userId: user1.id });
  });

  afterEach(async () => {
    await User.deleteAll();
    await Project.deleteAll();
    await Entry.deleteAll();
    await EntryType.deleteAll();
  });

  describe('#bulkDelete', async () => {

    beforeEach(async () => {
      const entryType = await EntryType
        .query()
        .insert({
          name: 'Test Entry Type',
          userId: user1.id,
          projectId: project1.id,
          fields: [
            textField
          ]
        });
      await Promise.all(
        range(5).map(async i => {
          return await Entry
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
        })
      );
    });

    afterEach(async () => {
      await Entry.deleteAll();
      await EntryType.deleteAll();
    });

    it('bulk deletes 3 entries', async () => {
      let entries = await Entry.query();
      assert.lengthOf(entries, 5);
      const entryIds = entries.map(entry => entry.id);
      const entryIdsToDelete = slice(entryIds, 0, 3);
      await Entry.bulkDelete(entryIdsToDelete, project1.id);
      entries = await Entry.query();
      assert.lengthOf(entries, 2);
    });

  });

});
