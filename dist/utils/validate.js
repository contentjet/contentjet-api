"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const underscore_string_1 = require("underscore.string");
const validate = require("validate.js");
const moment = require("moment");
const Media_1 = require("../models/Media");
const Entry_1 = require("../models/Entry");
const User_1 = require("../models/User");
validate.extend(validate.validators.datetime, {
    parse: function (value) {
        return +moment.utc(value);
    },
    format: function (value) {
        return moment.utc(value).format();
    }
});
validate.validators.lessThanAttribute = function (value, options, _key, attributes) {
    if (!validate.isDefined(value))
        return;
    const siblingAttributeName = options;
    const siblingAttributeValue = lodash_1.get(attributes, siblingAttributeName);
    if (!validate.isNumber(value))
        return 'must be a number';
    if (!validate.isNumber(siblingAttributeValue) || value > siblingAttributeValue) {
        return `must be less than ${underscore_string_1.humanize(siblingAttributeName)}`;
    }
    return undefined;
};
validate.validators.boolean = function (value) {
    if (!validate.isDefined(value))
        return;
    if (!validate.isBoolean(value))
        return 'must be true or false';
    return undefined;
};
validate.validators.arrayLength = function (value, options) {
    if (!validate.isDefined(value))
        return;
    if (!validate.isArray(value))
        return 'must be an array';
    if ('is' in options) {
        if (value.length !== options.is)
            return `is the wrong length (should be ${options.is})`;
    }
    else if ('minimum' in options) {
        if (value.length < options.minimum)
            return `length is too short (minimum is ${options.minimum})`;
    }
    else if ('maximum' in options) {
        if (value.length > options.maximum)
            return `length is too long (maximum is ${options.minimum})`;
    }
    return undefined;
};
validate.validators.arrayOfIds = function (value) {
    if (!validate.isDefined(value))
        return;
    if (!validate.isArray(value))
        return 'must be an array';
    for (let id of value) {
        if (!validate.isInteger(id) || id < 1)
            return 'must contain positive integers only';
    }
    return undefined;
};
validate.validators.arrayOfStrings = function (value) {
    if (!validate.isDefined(value))
        return;
    if (!validate.isArray(value))
        return 'must be an array';
    for (let item of value) {
        if (!validate.isString(item))
            return 'must contain strings only';
    }
    return undefined;
};
validate.validators.uniqueArray = function (value) {
    if (!validate.isDefined(value))
        return;
    if (!validate.isArray(value))
        return 'must be an array';
    if (value.length !== lodash_1.uniq(value).length)
        return 'must not contain duplicate values';
    return undefined;
};
validate.validators.choicesUnion = function (value, options) {
    if (!validate.isDefined(value))
        return;
    if (!validate.isArray(value))
        return 'must be an array';
    const { choices } = options;
    if (choices.length !== lodash_1.union(choices, value).length)
        return 'contains invalid choice';
    return undefined;
};
validate.validators.media = async function (value, options) {
    if (!validate.isDefined(value))
        return;
    const { projectId } = options;
    if (!validate.isArray(value))
        return 'must be an array';
    const ids = [];
    for (const item of value) {
        if (!lodash_1.isPlainObject(item))
            return 'must be an array of objects';
        if (!item.id)
            return 'must contain objects with id property';
        ids.push(item.id);
    }
    const result = await Media_1.default
        .query()
        .count('*')
        .where('projectId', projectId)
        .whereIn('id', ids)
        .first();
    if (parseInt(result.count) !== ids.length) {
        return 'contains media not found in project';
    }
    return undefined;
};
validate.validators.entries = async function (value, options) {
    if (!validate.isDefined(value))
        return;
    const { projectId } = options;
    if (!validate.isArray(value))
        return 'must be an array';
    const ids = [];
    for (const item of value) {
        if (!lodash_1.isPlainObject(item))
            return 'must be an array of objects';
        if (!item.id)
            return 'must contain objects with id property';
        ids.push(item.id);
    }
    const result = await Entry_1.default
        .query()
        .count('entry.*')
        .joinRelation('entryType')
        .where('entryType.projectId', projectId)
        .whereIn('entry.id', ids)
        .first();
    if (parseInt(result.count) !== ids.length) {
        return 'contains entries not found in project';
    }
    return undefined;
};
validate.validators.projectMember = async function (value, options) {
    if (!validate.isDefined(value))
        return;
    if (!validate.isInteger(value) || value < 1)
        return 'must be a valid id';
    const { project } = options;
    const user = await User_1.default.getById(value);
    if (!user)
        return 'invalid user';
    const isMember = await project.isMember(user.id);
    if (!isMember)
        return 'user is not a member of this project';
    return undefined;
};
validate.validators.tags = function (value) {
    if (!validate.isDefined(value))
        return;
    if (!validate.isArray(value))
        return 'must be an array';
    for (const item of value) {
        if (!validate.isString(item))
            return 'must be an array of strings';
        // Below regex lifted from here:
        // https://stackoverflow.com/questions/22454258/js-regex-string-validation-for-slug
        if (!item.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/))
            return 'must be an array of lowercase slugs';
    }
    return undefined;
};
exports.default = validate;
