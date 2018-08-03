import * as mkdirp from 'mkdirp';

export default (path: string) => {
  return new Promise((resolve, reject) => {
    mkdirp(path, err => {
      if (err) return reject(err);
      resolve();
    });
  });
};
