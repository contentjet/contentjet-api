import '../server';
import config from '../config';
import Project from '../models/Project';
import EntryType from '../models/EntryType';
import User from '../models/User';
import {assert} from 'chai';
import axios, {AxiosInstance} from 'axios';
import {cloneDeep} from 'lodash';

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

const booleanField = {
  name: 'testBooleanField',
  label: 'Test boolean field',
  description: '',
  required: false,
  disabled: false,
  fieldType: 'BOOLEAN',
  labelTrue: 'Yes',
  labelFalse: 'No'
};

const numberField = {
  name: 'testNumberField',
  label: 'Test number field',
  description: '',
  required: false,
  disabled: false,
  fieldType: 'NUMBER',
  minValue: -99999,
  maxValue: 99999,
  format: 'integer'
};

const dateField = {
  name: 'testDateField',
  label: 'Test date field',
  description: '',
  required: false,
  disabled: false,
  fieldType: 'DATE',
  format: 'datetime'
};

const choiceField = {
  name: 'choiceField',
  label: 'Test choice field',
  description: '',
  required: false,
  disabled: false,
  fieldType: 'CHOICE',
  choices: [
    'foo',
    'bar',
    'eggs',
    'spam'
  ],
  format: 'single'
};

const colorField = {
  name: 'colorField',
  label: 'Test color field',
  description: '',
  required: false,
  disabled: false,
  fieldType: 'COLOR',
  format: 'rgb'
};

const listField = {
  name: 'listField',
  label: 'Test list field',
  description: '',
  required: false,
  disabled: false,
  fieldType: 'LIST',
  minLength: 0,
  maxLength: 999
};

const validEntryTypeData: any = {
  name: 'Test Entry Type',
  description: 'Just a test entry type',
  metadata: '',
  fields: [
    textField,
    longTextField,
    booleanField,
    numberField,
    dateField,
    choiceField,
    colorField,
    listField
  ]
};

describe('EntryType - Integration', function () {
  let client: AxiosInstance;
  let user1: User;
  let project1: Project;
  let token: string;

  beforeEach(async function () {
    await EntryType.deleteAll();
    await User.deleteAll();
    await Project.deleteAll();
    user1 = await User.create('user1@example.com', 'User1', '12345', true);
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
          password: '12345',
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
    await EntryType.deleteAll();
    await User.deleteAll();
    await Project.deleteAll();
  });

  describe('#create', async function () {

    it('creates an EntryType', async function () {
      const response = await client.post(
        `project/${project1.id}/entry-type/`,
        validEntryTypeData
      );
      assert.equal(response.status, 201);
      assert.lengthOf(response.data.fields, validEntryTypeData.fields.length);
    });

    it('creates an EntryType ignoring extra fields', async function () {
      const data = cloneDeep(validEntryTypeData);
      // Assuming the data is valid, any extra fields should be ignored
      data.someUnexpectedField = 'blah';
      const response = await client.post(
        `project/${project1.id}/entry-type/`,
        data
      );
      assert.equal(response.status, 201);
    });

  });

});
