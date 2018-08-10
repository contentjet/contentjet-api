"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const util_1 = require("util");
const mkdirp_1 = require("../../utils/mkdirp");
const config_1 = require("../../config");
const writeFile = util_1.promisify(fs.writeFile);
class DiskStorageBackend {
    constructor() {
        this.mediaRoot = config_1.default.MEDIA_ROOT;
    }
    async write(projectId, file) {
        const now = new Date();
        // Create directory
        const dir = path.resolve(path.join(this.mediaRoot, String(projectId), `${now.getFullYear()}-${now.getMonth() + 1}`));
        await mkdirp_1.default(dir);
        // Write file buffer to disk
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000000)}${path.extname(file.originalname)}`;
        const filePath = path.join(dir, fileName);
        await writeFile(path.join(dir, fileName), file.buffer);
        // Write thumbnail buffer to disk if it exists
        let thumbnailFileName;
        let thumbnailFilePath;
        if (file.thumbnailBuffer) {
            thumbnailFileName = fileName.replace(/(\w+)(\.\w+)$/, '$1-thumb$2');
            thumbnailFilePath = path.join(dir, thumbnailFileName);
            await writeFile(path.join(dir, thumbnailFileName), file.thumbnailBuffer);
        }
        return {
            filePath: path.relative(this.mediaRoot, filePath),
            thumbnailPath: thumbnailFilePath ? path.relative(this.mediaRoot, thumbnailFilePath) : undefined
        };
    }
}
exports.default = DiskStorageBackend;
