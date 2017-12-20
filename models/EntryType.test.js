const app = require('../app');
const assert = require('chai').assert;
const User = app.models.User;
const Project = app.models.Project;
const EntryType = app.models.EntryType;

describe('EntryType', function () {

  let user1;
  let project1;
  let entryType1;

  beforeEach(async function () {
    await EntryType.deleteAll();
    await User.deleteAll();
    await Project.deleteAll();
    user1 = await User.create('user1@example.com', 'User1', '12345');
    project1 = await Project
      .query()
      .insert({
        name: 'Test Project 1',
        userId: user1.id
      });
    entryType1 = await EntryType
      .query()
      .insert({
        name: 'Test Entry Type',
        userId: user1.id,
        projectId: project1.id, fields: []
      });
  });

  afterEach(async function () {
    await EntryType.deleteAll();
    await User.deleteAll();
    await Project.deleteAll();
  });

  describe('#getById', async function () {

    it('gets an EntryType by id', async function () {
      const entryType = await EntryType.getById(entryType1.id);
      assert.equal(entryType.id, entryType1.id);
    });

  });

  describe('#existsInProject', async function () {

    it('EntryType exists in project', async function () {
      const exists = await EntryType.existsInProject(entryType1.id, project1.id);
      assert.isTrue(exists);
    });

    it('EntryType does not exist in project', async function () {
      const exists = await EntryType.existsInProject(entryType1.id, 123);
      assert.isFalse(exists);
    });

  });

});
