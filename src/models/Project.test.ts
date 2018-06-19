import '../app';
import Project from './Project';
import WebHook from './WebHook';
import User from './User';
import { get } from 'lodash';
import { assert } from 'chai';

describe('Project', () => {

  let user1: User;
  let user2: User;
  let user3: User;
  let project1: Project;

  beforeEach(async () => {
    await User.deleteAll();
    await Project.deleteAll();
    user1 = await User.create('user1@example.com', 'User1', '12345');
    user2 = await User.create('user2@example.com', 'User2', '12345');
    user3 = await User.create('user3@example.com', 'User3', '12345');
    project1 = await Project
      .query()
      .insert({name: 'Test Project 1', userId: user1.id});
  });

  afterEach(async () => {
    await User.deleteAll();
    await Project.deleteAll();
  });

  describe('#getById', async () => {

    it('gets a project by id', async () => {
      const project = await Project.getById(project1.id);
      assert.equal(get(project, 'id'), project1.id);
    });

  });

  describe('#deleteAll', async () => {

    it('deletes all projects', async () => {
      const numDeleted = await Project.deleteAll();
      assert.equal(numDeleted, 1);
    });

  });

  describe('#getUsers', async () => {

    beforeEach(async () => {
      await project1.addUser(user1, 'author');
      await project1.addUser(user2, 'author');
      await project1.addUser(user3, 'author');
    });

    it('returns 3 users', async () => {
      const users = await project1.getUsers();
      assert.lengthOf(users, 3, 'has length of 3');
    });

  });

  describe('#getUserById', async () => {

    beforeEach(async () => {
      await project1.addUser(user1, 'author');
    });

    it('returns project user', async () => {
      const user = await project1.getUserById(user1.id);
      assert.strictEqual(get(user, 'membershipType'), 'author');
      assert.strictEqual(get(user, 'membershipIsActive'), true);
      assert.strictEqual(get(user, 'id'), user1.id);
    });

  });

  describe('#isMember', async () => {

    beforeEach(async () => {
      await project1.addUser(user1, 'author');
    });

    it('user is project member', async () => {
      const isMember = await project1.isMember(user1.id);
      assert.isTrue(isMember);
    });

    it('user is not project member', async () => {
      const isMember = await project1.isMember(user2.id);
      assert.isFalse(isMember);
    });

    it('user is project member with membershipType', async () => {
      const isMember = await project1.isMember(user1.id, 'author');
      assert.isTrue(isMember);
    });

    it('user is not project member with membershipType', async () => {
      const isMember = await project1.isMember(user2.id, 'admin');
      assert.isFalse(isMember);
    });

  });

  describe('#isOwner', async () => {

    it('user is project owner', async () => {
      const isOwner = await project1.isOwner(user1.id);
      assert.isTrue(isOwner);
    });

    it('user is not project owner', async () => {
      const isOwner = await project1.isOwner(user2.id);
      assert.isFalse(isOwner);
    });

  });

  describe('#getUsersByMembershipType', async () => {

    beforeEach(async () => {
      await project1.addUser(user1, 'author');
      await project1.addUser(user2, 'admin');
      // Calling addUser multiple times with the same user regardless
      // of type should only add the user once.
      await project1.addUser(user3, 'author');
      await project1.addUser(user3, 'author');
      await project1.addUser(user3, 'admin');
    });

    it('returns 2 users', async () => {
      const users = await project1.getUsersByMembershipType('author');
      assert.lengthOf(users, 2, 'has length of 2');
    });

    it('returns 1 users', async () => {
      const users = await project1.getUsersByMembershipType('admin');
      assert.lengthOf(users, 1, 'has length of 1');
    });

  });

  describe('#addUser', async () => {

    it('adds user to project', async () => {
      let isMember;
      isMember = await project1.isMember(user2.id);
      assert.isFalse(isMember, 'user is not member');
      await project1.addUser(user2, 'author');
      isMember = await project1.isMember(user2.id);
      assert.isTrue(isMember, 'user is member');
    });

  });

  describe('#removeUser', async () => {

    beforeEach(async () => {
      await project1.addUser(user2, 'author');
    });

    it('removes user from project', async () => {
      let isMember;
      isMember = await project1.isMember(user2.id);
      assert.isTrue(isMember);
      await project1.removeUser(user2.id);
      isMember = await project1.isMember(user2.id);
      assert.isFalse(isMember);
    });

  });

  describe('#delete', async () => {

    it('deletes the project', async () => {
      const numDeleted = await Project.deleteAll();
      assert.equal(numDeleted, 1);
    });

  });

  describe('#getActiveWebHooks', async () => {

    beforeEach(async () => {
      await WebHook
        .query()
        .insert({
          name: 'webHook1',
          url: 'http://example.com',
          isActive: true,
          projectId: project1.id
        });
      await WebHook
        .query()
        .insert({
          name: 'webHook2',
          url: 'http://example.com',
          isActive: true,
          projectId: project1.id
        });
      await WebHook
        .query()
        .insert({
          name: 'webHook3',
          url: 'http://example.com',
          isActive: false,
          projectId: project1.id
        });
    });

    it('project has 2 active webooks', async () => {
      const webHooks = await project1.getActiveWebHooks();
      assert.lengthOf(webHooks, 2, 'has length of 2');
    });

  });

  describe('#updateUserMembership', async () => {

    beforeEach(async () => {
      await project1.addUser(user2, 'author');
    });

    afterEach(async () => {
      await project1.removeUser(user2.id);
    });

    it('changes an existing users membershipType', async () => {
      await project1.updateUserMembership(user2.id, true, 'admin');
      const users = await project1.getUsers();
      assert.lengthOf(users, 1);
      assert.strictEqual(users[0].membershipType, 'admin');
      assert.isTrue(users[0].membershipIsActive);
    });

    it('sets membershipIsActive to false', async () => {
      let isActiveMember = await project1.isActiveMember(user2.id);
      assert.isTrue(isActiveMember);
      await project1.updateUserMembership(user2.id, false);
      isActiveMember = await project1.isActiveMember(user2.id);
      assert.isFalse(isActiveMember);
      const users = await project1.getUsers();
      assert.lengthOf(users, 1);
      assert.strictEqual(users[0].membershipType, 'author');
      assert.isFalse(users[0].membershipIsActive);
    });

  });

});
