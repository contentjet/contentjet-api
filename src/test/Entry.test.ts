import '../server';
import config from '../config';
import User from '../models/User';
import Entry from '../models/Entry';
import EntryType from '../models/EntryType';
import Project from '../models/Project';
import * as _ from 'lodash';
import {assert} from 'chai';
import axios, {AxiosInstance} from 'axios';

const BASE_URL = `http://localhost:${config.PORT}/`;

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

const validEntryTypeData: any = {
  name: 'Test Entry Type',
  description: 'Just a test entry type',
  metadata: '',
  fields: [
    textField,
    longTextField
  ]
};

const validEntryData: any = {
  entryTypeId: null,
  name: 'Test Entry',
  published: '1970-01-01T00:00:00Z',
  tags:[],
  fields: {
    'testTextField': 'Hello',
    'testLongTextField': 'World'
  }
}


describe('Entry - Integration', function () {
  let client: AxiosInstance;
  let token: string;
  let user1: User;
  let project1: Project;

  before(async function () {
    user1 = await User.create('user1@example.com', 'User1', '123456', true);
    project1 = await Project
      .query()
      .insert({
        name: 'Test Project 1',
        userId: user1.id
      });
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

  after(async function () {
    await User.deleteAll();
    await Entry.deleteAll();
    await EntryType.deleteAll();
  });

  describe('#update', async function () {

    let entryTypeId: number;
    let entryId: number;

    beforeEach(async function () {
      // Create entry type
      const entryTypeResponse = await client.post(`project/${project1.id}/entry-type/`, validEntryTypeData);
      entryTypeId = entryTypeResponse.data.id;
      // Create entry
      const data = _.cloneDeep(validEntryData);
      data.entryTypeId = entryTypeId;
      const entryResponse = await client.post(`project/${project1.id}/entry/`, data);
      entryId = entryResponse.data.id;
    });

    afterEach(async function () {
      await Entry.deleteAll();
      await EntryType.deleteAll();
    });

    it('updates an entry\'s field', async function () {
      const data = _.cloneDeep(validEntryData);
      data.userId = user1.id;
      data.entryTypeId = entryTypeId;
      data.fields.testTextField = 'This is new!';
      const response = await client.put(
        `project/${project1.id}/entry/${entryId}`, data
      );
      assert.equal(response.status, 200);
      assert.equal(response.data.fields.testTextField, 'This is new!');
    });

  });

});
