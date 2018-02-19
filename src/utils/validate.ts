import {get, uniq, union, isPlainObject} from 'lodash';
import {humanize} from 'underscore.string';
import * as validate from 'validate.js';
import * as moment from 'moment';
import Media from '../models/Media';
import Entry from '../models/Entry';
import User from '../models/User';
import Project from '../models/Project';


validate.extend(validate.validators.datetime, {
  parse: function(value: any) {
    return +moment.utc(value);
  },
  format: function(value: any) {
    return moment.utc(value).format();
  }
});

validate.validators.lessThanAttribute = function (value: any, options: string, _key: string, attributes: object): string|undefined {
  if (!validate.isDefined(value)) return;
  const siblingAttributeName = options;
  const siblingAttributeValue = get(attributes, siblingAttributeName);
  if (!validate.isNumber(value)) return 'must be a number';
  if (!validate.isNumber(siblingAttributeValue) || value > siblingAttributeValue) {
    return `must be less than ${humanize(siblingAttributeName)}`;
  }
  return undefined;
};

validate.validators.boolean = function (value: any): string|undefined {
  if (!validate.isDefined(value)) return;
  if (!validate.isBoolean(value)) return 'must be true or false';
  return undefined;
};

validate.validators.arrayLength = function (value: any, options: any): string|undefined {
  if (!validate.isDefined(value)) return;
  if (!validate.isArray(value)) return 'must be an array';
  if ('is' in options && value.length !== options.is) {
    return `is the wrong length (should be ${options.is})`;
  }
  if ('minimum' in options && value.length < options.minimum) {
    return `length is too short (minimum is ${options.minimum})`;
  }
  if ('maximum' in options && value.length > options.maximum) {
    return `length is too long (maximum is ${options.maximum})`;
  }
  return undefined;
};

validate.validators.arrayOfIds = function (value: any): string|undefined {
  if (!validate.isDefined(value)) return;
  if (!validate.isArray(value)) return 'must be an array';
  for (let id of value) {
    if (!validate.isInteger(id) || id < 1) return 'must contain positive integers only';
  }
  return undefined;
};

validate.validators.arrayOfStrings = function (value: any): string|undefined {
  if (!validate.isDefined(value)) return;
  if (!validate.isArray(value)) return 'must be an array';
  for (let item of value) {
    if (!validate.isString(item)) return 'must contain strings only';
  }
  return undefined;
};

validate.validators.uniqueArray = function (value: any): string|undefined {
  if (!validate.isDefined(value)) return;
  if (!validate.isArray(value)) return 'must be an array';
  if (value.length !== uniq(value).length) return 'must not contain duplicate values';
  return undefined;
};

validate.validators.choicesUnion = function (value: any, options: {choices: string[]}): string|undefined {
  if (!validate.isDefined(value)) return;
  if (!validate.isArray(value)) return 'must be an array';
  const {choices} = options;
  if (choices.length !== union(choices, value).length) return 'contains invalid choice';
  return undefined;
};

validate.validators.media = async function (value: any, options: {projectId: number}) {
  if (!validate.isDefined(value)) return;
  const {projectId} = options;
  if (!validate.isArray(value)) return 'must be an array';
  const ids = [];
  for (const item of value) {
    if (!isPlainObject(item)) return 'must be an array of objects';
    if (!item.id) return 'must contain objects with id property';
    ids.push(item.id);
  }
  const result = await Media
    .query()
    .count('*')
    .where('projectId', projectId)
    .whereIn('id', ids)
    .first() as any;
  if (parseInt(result.count) !== ids.length) {
    return 'contains media not found in project';
  }
  return undefined;
};

validate.validators.entries = async function (value: any, options: {projectId: number}) {
  if (!validate.isDefined(value)) return;
  const {projectId} = options;
  if (!validate.isArray(value)) return 'must be an array';
  const ids = [];
  for (const item of value) {
    if (!isPlainObject(item)) return 'must be an array of objects';
    if (!item.id) return 'must contain objects with id property';
    ids.push(item.id);
  }
  const result = await Entry
    .query()
    .count('entry.*')
    .joinRelation('entryType')
    .where('entryType.projectId', projectId)
    .whereIn('entry.id', ids)
    .first() as any;
  if (parseInt(result.count) !== ids.length) {
    return 'contains entries not found in project';
  }
  return undefined;
};

validate.validators.projectMember = async function (value: any, options: {project: Project}) {
  if (!validate.isDefined(value)) return;
  if (!validate.isInteger(value) || value < 1) return 'must be a valid id';
  const {project} = options;
  const user = await User.getById(value);
  if (!user) return 'invalid user';
  const isMember = await project.isMember(user.id);
  if (!isMember) return 'user is not a member of this project';
  return undefined;
};

validate.validators.tags = function (value: any): string|undefined {
  if (!validate.isDefined(value)) return;
  if (!validate.isArray(value)) return 'must be an array';
  for (const item of value) {
    if (!validate.isString(item)) return 'must be an array of strings';
    // Below regex lifted from here:
    // https://stackoverflow.com/questions/22454258/js-regex-string-validation-for-slug
    if (!item.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)) return 'must be an array of lowercase slugs';
  }
  return undefined;
};

export default validate;
