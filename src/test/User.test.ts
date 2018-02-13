import '../server';
import config from '../config';
import User from '../models/User';
import {assert} from 'chai';
import axios, {AxiosInstance} from 'axios';

const BASE_URL = `http://localhost:${config.PORT}/`;

describe('User - Integration', function () {
  let client: AxiosInstance;
  let token: string;

  beforeEach(async function () {
    await User.create('user1@example.com', 'User1', '123456', true);
    const loginResponse = await axios
      .post(
        `${BASE_URL}user/authenticate`,
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

  afterEach(async function () {
    await User.deleteAll();
  });

  describe('#change-password', async function () {

    it('changes the authenticated user\'s password', async function () {
      const response = await client.post(
        'user/change-password/',
        {
          password: '123456',
          newPassword: 'mynewpassword'
        }
      );
      assert.equal(response.status, 200);
      const loginResponse = await axios
        .post(
          `${BASE_URL}user/authenticate`,
          {
            username: 'user1@example.com',
            password: 'mynewpassword',
            grant_type: 'password'
          }
        );
      assert.equal(loginResponse.status, 200);
    });

    it('fails to change the authenticated user\'s password because it\'s too short', async function () {
      try {
        await client.post(
          'user/change-password/',
          {
            password: '123456',
            newPassword: 'x'
          }
        );
      } catch (err) {
        assert.equal(err.response.status, 400);
      }
    });

    it('fails to change the authenticated user\'s password because current password is wrong', async function () {
      try {
        await client.post(
          'user/change-password/',
          {
            password: 'wrongpassword',
            newPassword: 'mynewpassword'
          }
        );
      } catch (err) {
        assert.equal(err.response.status, 400);
      }
    });

  });

});
