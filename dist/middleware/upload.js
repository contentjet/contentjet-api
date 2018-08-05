"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const multer = require("koa-multer");
exports.default = async (ctx, next) => {
    const upload = multer({ storage: multer.memoryStorage() });
    await upload.single('file')(ctx, next);
};
