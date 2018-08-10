import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import mkdirp from '../../utils/mkdirp';
import { IFile, IStorageBackend } from '../../types';
import config from '../../config';

const writeFile = promisify(fs.writeFile);

export default class DiskStorageBackend implements IStorageBackend {

  mediaRoot: string;

  constructor() {
    this.mediaRoot = config.MEDIA_ROOT;
  }

  async write(projectId: number, file: IFile) {
    const now = new Date();
    // Create directory
    const dir = path.resolve(
      path.join(this.mediaRoot, String(projectId), `${now.getFullYear()}-${now.getMonth() + 1}`)
    );
    await mkdirp(dir);
    // Write file buffer to disk
    const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000000)}${path.extname(file.originalname)}`;
    const filePath = path.join(dir, fileName);
    await writeFile(path.join(dir, fileName), file.buffer);
    // Write thumbnail buffer to disk if it exists
    let thumbnailFileName: string | undefined;
    let thumbnailFilePath: string | undefined;
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
