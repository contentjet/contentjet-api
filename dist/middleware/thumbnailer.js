"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sharp = require("sharp");
const lodash_1 = require("lodash");
const config_1 = require("../config");
exports.default = async (ctx, next) => {
    const { file } = ctx.req;
    if (file && ['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype)) {
        // Get the dimensions of uploaded image
        const metadata = await sharp(file.buffer).metadata();
        file.width = lodash_1.get(metadata, 'width', 0);
        file.height = lodash_1.get(metadata, 'height', 0);
        // Create thumbnail
        if (config_1.default.THUMBNAIL_WIDTH > 0 && config_1.default.THUMBNAIL_HEIGHT > 0) {
            file.thumbnailBuffer = await sharp(file.buffer)
                .resize(config_1.default.THUMBNAIL_WIDTH, config_1.default.THUMBNAIL_HEIGHT)
                .max()
                .toBuffer();
        }
    }
    await next();
};
