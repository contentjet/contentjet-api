require('dotenv').config();
import config from './config';
import app from './app';

app.listen(config.PORT, function () {
  console.log(`Listening on port ${config.PORT}!`);
});
