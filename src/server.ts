const config = require('./config');
import app from './app';

app.listen(config.PORT, function () {
  console.log(`Listening on port ${config.PORT}!`);
});
