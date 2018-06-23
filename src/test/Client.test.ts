import '../server';
import config from '../config';
import User from '../models/User';
import Client from '../models/Client';
import Project from '../models/Project';
import { assert } from 'chai';
import axios, { AxiosInstance } from 'axios';

const BASE_URL = `http://localhost:${config.PORT}/`;

describe('Client - Integration', () => {
  let client: AxiosInstance;
  let token: string;
  let user1: User;
  let project1: Project;

  before(async () => {
    user1 = await User.create('user1@example.com', 'User1', '123456', true);
    project1 = await Project
      .query()
      .insert({
        name: 'Test Project 1',
        userId: user1.id
      });
    const loginResponse = await axios
      .post(
        `${BASE_URL}authenticate`,
        {
          username: 'user1@example.com',
          password: '123456',
          grant_type: 'password'
        }
      );
    token = loginResponse.data.access_token;
    client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': `application/json`,
        'Authorization': `Bearer ${token}`
      }
    });
  });

  after(async () => {
    await Project.deleteAll();
    await User.deleteAll();
  });

  describe('#create', async () => {

    afterEach(async () => {
      await Client.deleteAll();
    });

    it('creates a client', async () => {
      const data = {
        name: 'Test client'
      };
      const response = await client.post(
        `project/${project1.id}/client/`, data
      );
      assert.equal(response.status, 201);
      assert.equal(response.data.name, 'Test client');
      assert.lengthOf(response.data.clientId, 32);
      assert.lengthOf(response.data.clientSecret, 32);
    });

  });

  describe('#authenticate', async () => {

    let authClient: Client;

    before(async () => {
      authClient = await Client.create(project1.id, 'Test client');
    });

    afterEach(async () => {
      await Client.deleteAll();
    });

    it('authenticates a client', async () => {
      const data = {
        client_id: authClient.clientId,
        client_secret: authClient.clientSecret,
        grant_type: 'client_credentials'
      };
      const response = await axios.post(
        `${BASE_URL}project/${project1.id}/client/authenticate`, data
      );
      assert.equal(response.status, 200);
      assert.exists(response.data.access_token);
      assert.exists(response.data.expires_in);
      assert.equal(response.data.token_type, 'bearer');
    });

  });

});
