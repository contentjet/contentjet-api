import {Project, EntryType, User} from '../app';
import {get} from 'lodash';
import {assert} from 'chai';

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

describe('EntryType', function () {

  let user1: User;
  let project1: Project;
  let entryType1: EntryType;

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
        projectId: project1.id,
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
      assert.equal(get(entryType, 'id'), entryType1.id);
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

  describe('#deleteAll', async function () {

    it('deletes all entry types', async function () {
      const numDeleted = await EntryType.deleteAll();
      assert.equal(numDeleted, 1);
    });

  });

});
