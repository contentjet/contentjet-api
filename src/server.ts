import config from './config';
import initApp from './app';

const main = async () => {
  const app = await initApp();
  app.listen(config.PORT, () => {
    // tslint:disable-next-line
    console.log(`Listening on port ${config.PORT}!`);
  });
};

main();
