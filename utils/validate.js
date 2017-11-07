const _ = require('lodash');
const humanize = require('underscore.string/humanize');
const validate = require('validate.js');
const moment = require('moment');
const Media = require('../models/Media');
const Entry = require('../models/Entry');
const User = require('../models/User');


validate.extend(validate.validators.datetime, {
  parse: function(value, options) {
    return +moment.utc(value);
  },
  format: function(value, options) {
    return moment.utc(value).format();
  }
});

validate.validators.lessThanAttribute = function (value, options, key, attributes) {
  if (!validate.isDefined(value)) return;
  const siblingAttributeName = options;
  const siblingAttributeValue = _.get(attributes, siblingAttributeName);
  if (!_.isNumber(value)) return 'must be a number';
  if (!_.isNumber(siblingAttributeValue) || value > siblingAttributeValue) {
    return `must be less than ${humanize(siblingAttributeName)}`;
  }
};

validate.validators.boolean = function (value, options, key, attributes) {
  if (!validate.isDefined(value)) return;
  if (!_.isBoolean(value)) return 'must be true or false';
};

validate.validators.arrayLength = function (value, options, key, attributes) {
  if (!validate.isDefined(value)) return;
  if (!_.isArray(value)) return 'must be an array';
  if ('is' in options) {
    if (value.length !== options.is) return `is the wrong length (should be ${options.is})`;
  } else if ('minimum' in options) {
    if (value.length < options.minimum) return `length is too short (minimum is ${options.minimum})`;
  } else if ('maximum' in options) {
    if (value.length > options.maximum) return `length is too long (maximum is ${options.minimum})`;
  }
};

validate.validators.arrayOfIds = function (value, options, key, attributes) {
  if (!validate.isDefined(value)) return;
  if (!_.isArray(value)) return 'must be an array';
  for (let id of value) {
    if (!_.isInteger(id) || id < 1) return 'must contain positive integers only';
  }
};

validate.validators.arrayOfStrings = function (value, options, key, attributes) {
  if (!validate.isDefined(value)) return;
  if (!_.isArray(value)) return 'must be an array';
  for (let item of value) {
    if (!_.isString(item)) return 'must contain strings only';
  }
};

validate.validators.uniqueArray = function (value, options, key, attributes) {
  if (!validate.isDefined(value)) return;
  if (!_.isArray(value)) return 'must be an array';
  if (value.length !== _.uniq(value).length) return 'must not contain duplicate values';
};

validate.validators.choicesUnion = function (value, options, key, attributes) {
  if (!validate.isDefined(value)) return;
  if (!_.isArray(value)) return 'must be an array';
  const {choices} = options;
  if (choices.length !== _.union(choices, value).length) return 'contains invalid choice';
};

validate.validators.media = async function (value, options, key, attributes) {
  if (!validate.isDefined(value)) return;
  const {projectId} = options;
  if (!_.isArray(value)) return 'must be an array';
  const ids = [];
  for (const item of value) {
    if (!_.isPlainObject(item)) return 'must be an array of objects';
    if (!item.id) return 'must contain objects with id property';
    ids.push(item.id);
  }
  const result = await Media
    .query()
    .count('*')
    .where('projectId', projectId)
    .whereIn('id', ids)
    .first();
  if (parseInt(result.count) !== ids.length) {
    return 'contains media not found in project';
  }
};

validate.validators.entries = async function (value, options, key, attributes) {
  if (!validate.isDefined(value)) return;
  const {projectId} = options;
  if (!_.isArray(value)) return 'must be an array';
  const ids = [];
  for (const item of value) {
    if (!_.isPlainObject(item)) return 'must be an array of objects';
    if (!item.id) return 'must contain objects with id property';
    ids.push(item.id);
  }
  const result = await Entry
    .query()
    .count('entry.*')
    .joinRelation('entryType')
    .where('entryType.projectId', projectId)
    .whereIn('entry.id', ids)
    .first();
  if (parseInt(result.count) !== ids.length) {
    return 'contains entries not found in project';
  }
};

validate.validators.projectMember = async function (value, options, key, attributes) {
  if (!validate.isDefined(value)) return;
  if (!validate.isInteger(value) || value < 1) return 'must be a valid id';
  const {project} = options;
  const user = await User.getById(value);
  if (!user) return 'invalid user';
  const isMember = await project.isMember(user);
  if (!isMember) return 'user is not a member of this project';
};

validate.validators.tags = function (value, options, key, attributes) {
  if (!validate.isDefined(value)) return;
  if (!_.isArray(value)) return 'must be an array';
  for (const item of value) {
    if (!_.isString(item)) return 'must be an array of strings';
    // Below regex lifted from here:
    // https://stackoverflow.com/questions/22454258/js-regex-string-validation-for-slug
    if (!item.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)) return 'must be an array of lowercase slugs';
  }
};

module.exports= validate;
