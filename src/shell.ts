import * as repl from 'repl';
import app from './app';

const replServer = repl.start({prompt: 'contentjet > '});
replServer.context.app = app;
