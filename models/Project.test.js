const app = require('../app');
const assert = require('chai').assert;
const User = app.models.User;
const Project = app.models.Project;
const WebHook = app.models.WebHook;

describe('Project', function () {

  let user1;
  let user2;
  let user3;
  let project1;

  beforeEach(async function () {
    await User.deleteAll();
    await Project.deleteAll();
    user1 = await User.create('user1@example.com', 'User1', '12345');
    user2 = await User.create('user2@example.com', 'User2', '12345');
    user3 = await User.create('user3@example.com', 'User3', '12345');
    project1 = await Project
      .query()
      .insert({name: 'Test Project 1', userId: user1.id});
  });

  afterEach(async function () {
    await User.deleteAll();
    await Project.deleteAll();
  });

  describe('#getById', async function () {

    it('gets a project by id', async function () {
      const project = await Project.getById(project1.id);
      assert.equal(project.id, project1.id);
    });

  });

  describe('#deleteAll', async function () {

    it('deletes all projects', async function () {
      const numDeleted = await Project.deleteAll();
      assert.equal(numDeleted, 1);
    });

  });

  describe('#getUsers', async function () {

    beforeEach(async function () {
      await project1.addUser(user1, 'author');
      await project1.addUser(user2, 'author');
      await project1.addUser(user3, 'author');
    });

    it('returns 3 users', async function () {
      const users = await project1.getUsers();
      assert.lengthOf(users, 3, 'has length of 3');
    });

  });

  describe('#getUserById', async function () {

    beforeEach(async function () {
      await project1.addUser(user1, 'author');
    });

    it('returns project user', async function () {
      const user = await project1.getUserById(user1.id);
      assert.strictEqual(user.membershipType, 'author');
      assert.strictEqual(user.membershipIsActive, true);
      assert.strictEqual(user.id, user1.id);
    });

  });

  describe('#isMember', async function () {

    beforeEach(async function () {
      await project1.addUser(user1, 'author');
    });

    it('user is project member', async function () {
      const isMember = await project1.isMember(user1);
      assert.isTrue(isMember);
    });

    it('user is not project member', async function () {
      const isMember = await project1.isMember(user2);
      assert.isFalse(isMember);
    });

    it('user is project member with membershipType', async function () {
      const isMember = await project1.isMember(user1, 'author');
      assert.isTrue(isMember);
    });

    it('user is not project member with membershipType', async function () {
      const isMember = await project1.isMember(user2, 'admin');
      assert.isFalse(isMember);
    });

  });

  describe('#isOwner', async function () {

    it('user is project owner', async function () {
      const isOwner = await project1.isOwner(user1);
      assert.isTrue(isOwner);
    });

    it('user is not project owner', async function () {
      const isOwner = await project1.isOwner(user2);
      assert.isFalse(isOwner);
    });

  });

  describe('#getUsersByMembershipType', async function () {

    beforeEach(async function () {
      await project1.addUser(user1, 'author');
      await project1.addUser(user2, 'admin');
      // Calling addUser multiple times with the same user regardless
      // of type should only add the user once.
      await project1.addUser(user3, 'author');
      await project1.addUser(user3, 'author');
      await project1.addUser(user3, 'admin');
    });

    it('returns 2 users', async function () {
      const users = await project1.getUsersByMembershipType('author');
      assert.lengthOf(users, 2, 'has length of 2');
    });

    it('returns 1 users', async function () {
      const users = await project1.getUsersByMembershipType('admin');
      assert.lengthOf(users, 1, 'has length of 1');
    });

  });

  describe('#addUser', async function () {

    it('adds user to project', async function () {
      let isMember;
      isMember = await project1.isMember(user2);
      assert.isFalse(isMember, 'user is not member');
      await project1.addUser(user2, 'author');
      isMember = await project1.isMember(user2);
      assert.isTrue(isMember, 'user is member');
    });

  });

  describe('#removeUser', async function () {

    beforeEach(async function () {
      await project1.addUser(user2, 'author');
    });

    it('removes user from project', async function () {
      let isMember;
      isMember = await project1.isMember(user2);
      assert.isTrue(isMember);
      await project1.removeUser(user2);
      isMember = await project1.isMember(user2);
      assert.isFalse(isMember);
    });

  });

  describe('#getActiveWebHooks', async function () {

    beforeEach(async function () {
      await WebHook.query().insert({name: 'webHook1', url: 'http://example.com', isActive: true, projectId: project1.id});
      await WebHook.query().insert({name: 'webHook2', url: 'http://example.com', isActive: true, projectId: project1.id});
      await WebHook.query().insert({name: 'webHook3', url: 'http://example.com', isActive: false, projectId: project1.id});
    });

    it('project has 2 active webooks', async function () {
      let webHooks = await project1.getActiveWebHooks();
      assert.lengthOf(webHooks, 2, 'has length of 2');
    });

  });

  describe('#updateUserMembership', async function () {

    beforeEach(async function () {
      await project1.addUser(user2, 'author');
    });

    afterEach(async function () {
      await project1.removeUser(user2);
    });

    it('changes an existing users membershipType', async function () {
      await project1.updateUserMembership(user2.id, {membershipType: 'admin'});
      const users = await project1.getUsers();
      assert.lengthOf(users, 1);
      assert.strictEqual(users[0].membershipType, 'admin');
      assert.isTrue(users[0].membershipIsActive);
    });

    it('sets membershipIsActive to false', async function () {
      let isActiveMember = await project1.isActiveMember(user2);
      assert.isTrue(isActiveMember);
      await project1.updateUserMembership(user2.id, {membershipIsActive: false});
      isActiveMember = await project1.isActiveMember(user2);
      assert.isFalse(isActiveMember);
      const users = await project1.getUsers();
      assert.lengthOf(users, 1);
      assert.strictEqual(users[0].membershipType, 'author');
      assert.isFalse(users[0].membershipIsActive);
    });

  });

});
