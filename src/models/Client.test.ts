import '../app';
import Project from './Project';
import User from './User';
import {assert} from 'chai';
import Client from './Client';

describe('Client', function () {

  let user1: User;
  let project1: Project;

  beforeEach(async function () {
    await User.deleteAll();
    await Project.deleteAll();
    user1 = await User.create('user1@example.com', 'User1', '12345');
    project1 = await Project
      .query()
      .insert({name: 'Test Project 1', userId: user1.id});
  });

  afterEach(async function () {
    await User.deleteAll();
    await Project.deleteAll();
  });

  describe('#create', async function () {

    afterEach(async function () {
      await Client.deleteAll();
    });

    it('creates a client for a project', async function () {
      let client = await Client.create(project1.id, 'Test Client')
      assert.equal(client.name, 'Test Client');
      assert.lengthOf(client.clientId, 32);
      assert.lengthOf(client.clientSecret, 32);
    });

  });

});
