import '../server';
import config from '../config';
import User from '../models/User';
import Project from '../models/Project';
import {assert} from 'chai';
import axios, {AxiosInstance} from 'axios';

const BASE_URL = `http://localhost:${config.PORT}/`;

describe('Project - Integration', function () {
  let client: AxiosInstance;
  let token: string;

  describe('#create project (non-admin)', async function () {

    before(async function () {
      // Create a non-admin user and login
      await User.create('user1@example.com', 'User1', '123456', true);
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

    after(async function () {
      await User.deleteAll();
      await Project.deleteAll();
    });

    it('fails as user is not an admin', async function () {
      try {
        var response = await client.post(
          'project/',
          {
            name: 'My Project'
          }
        );
      } catch (err) {
        assert.equal(err.response.status, 403);
        return;
      }
      assert.equal(response.status, 403);
    });

  });

});
