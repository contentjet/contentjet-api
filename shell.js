const repl = require('repl');
const app = require('./app');

const replServer = repl.start({prompt: 'contentjet > '});
replServer.context.app = app;
