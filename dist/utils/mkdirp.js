"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mkdirp = require("mkdirp");
exports.default = (path) => {
    return new Promise((resolve, reject) => {
        mkdirp(path, err => {
            if (err)
                return reject(err);
            resolve();
        });
    });
};
