import config from './config';
import app from './app';

app.listen(config.PORT, () => {
  // tslint:disable-next-line
  console.log(`Listening on port ${config.PORT}!`);
});
