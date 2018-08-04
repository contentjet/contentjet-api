import config from './config';
import * as knex from 'knex';
import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as cors from 'kcors';
import * as Router from 'koa-router';
import { Model } from 'objection';
Model.knex(
  knex({
    client: 'postgresql',
    connection: {
      host: config.POSTGRES_HOST,
      port: config.POSTGRES_PORT,
      database: config.POSTGRES_DB,
      user: config.POSTGRES_USER,
      password: config.POSTGRES_PASSWORD
    },
    pool: {
      min: config.POSTGRES_POOL_MIN,
      max: config.POSTGRES_POOL_MAX
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  })
);
import * as yaml from 'yamljs';

import { authenticateUser, tokenRefresh } from './authentication/jwt/routes';
import { requireAuthentication } from './authentication/jwt/middleware';

import ProjectViewSet from './viewsets/ProjectViewSet';
import UserViewSet from './viewsets/UserViewSet';
import ClientViewSet from './viewsets/ClientViewSet';
import WebHookViewSet from './viewsets/WebHookViewSet';
import ProjectInviteViewSet from './viewsets/ProjectInviteViewSet';
import MediaViewSet from './viewsets/MediaViewSet';
import MediaTagViewSet from './viewsets/MediaTagViewSet';
import EntryTypeViewSet from './viewsets/EntryTypeViewSet';
import EntryViewSet from './viewsets/EntryViewSet';
import EntryTagViewSet from './viewsets/EntryTagViewSet';

import Client from './models/Client';
import Entry from './models/Entry';
import EntryTag from './models/EntryTag';
import EntryType from './models/EntryType';
import Media from './models/Media';
import MediaTag from './models/MediaTag';
import Permission from './models/Permission';
import Project from './models/Project';
import ProjectInvite from './models/ProjectInvite';
import ProjectMembership from './models/ProjectMembership';
import Role from './models/Role';
import User from './models/User';
import WebHook from './models/WebHook';

import NotFoundError from './errors/NotFoundError';

import webHookMiddleware from './middleware/webhooks';
import errorsMiddleware from './middleware/errors';
import serveMediaMiddleware from './middleware/serveMedia';
import swaggerUIMiddleware from './middleware/swaggerUI';
import { IStorageBackend, IMailBackend } from './types';

export const models = {
  Client,
  Entry,
  EntryTag,
  EntryType,
  Media,
  MediaTag,
  Permission,
  Project,
  ProjectInvite,
  ProjectMembership,
  Role,
  User,
  WebHook
};

const initStorageBackend = async () => {
  const { default: storageClass } = await import(config.STORAGE_BACKEND);
  return new storageClass() as IStorageBackend;
};

const initMailBackend = async () => {
  const { default: mailClass } = await import(config.MAIL_BACKEND);
  return new mailClass() as IMailBackend;
};

const initRootRouter = (storage: IStorageBackend, mail: IMailBackend) => {
  const viewSetOptions = { storage, mail };
  // Instantiate root router and attach routes
  const router = new Router();
  router.post('/authenticate', authenticateUser);
  router.post('/token-refresh', requireAuthentication, tokenRefresh);
  router.use('/user/', new UserViewSet(viewSetOptions).routes());
  router.use('/project/:projectId(\\d+)/', async (ctx: Koa.Context, next: () => Promise<any>) => {
    const project = await Project.getById(ctx.params.projectId);
    if (!project) throw new NotFoundError();
    ctx.state.project = project;
    await next();
  });
  router.use('/project/', new ProjectViewSet(viewSetOptions).routes());
  router.use('/project/:projectId(\\d+)/web-hook/', new WebHookViewSet(viewSetOptions).routes());
  router.use('/project/:projectId(\\d+)/invite/', new ProjectInviteViewSet(viewSetOptions).routes());
  router.use('/project/:projectId(\\d+)/media/', new MediaViewSet(viewSetOptions).routes());
  router.use('/project/:projectId(\\d+)/media-tag/', new MediaTagViewSet(viewSetOptions).routes());
  router.use('/project/:projectId(\\d+)/entry-type/', new EntryTypeViewSet(viewSetOptions).routes());
  router.use('/project/:projectId(\\d+)/entry-tag/', new EntryTagViewSet(viewSetOptions).routes());
  router.use('/project/:projectId(\\d+)/entry/', new EntryViewSet(viewSetOptions).routes());
  router.use('/project/:projectId(\\d+)/client/', new ClientViewSet(viewSetOptions).routes());
  // Load the OpenAPI spec from disk converting YAML to JSON and dynamically populating
  // the servers array with our config.BACKEND_URL.
  const spec = yaml.load('spec.yml');
  if (!spec.servers) spec.servers = [];
  spec.servers.push({ url: config.BACKEND_URL });
  router.get('/spec', (ctx: Koa.Context) => {
    ctx.set('Cache-Control', 'max-age=604800');
    ctx.body = spec;
  });
  // robots.txt
  router.get('/robots.txt', (ctx: Koa.Context) => {
    ctx.set('Cache-Control', 'max-age=604800');
    ctx.body = 'User-agent: *\nDisallow: /';
  });
  return router;
};

export default async () => {
  const storage = await initStorageBackend();
  const mail = await initMailBackend();
  const router = initRootRouter(storage, mail);
  const app = new Koa();
  app
    .use(cors({ origin: config.CORS_ORIGIN }))
    .use(errorsMiddleware)
    .use(webHookMiddleware);
  if (config.SERVE_MEDIA) app.use(serveMediaMiddleware);
  if (config.SERVE_SWAGGER_UI) app.use(swaggerUIMiddleware());
  app
    .use(bodyParser())
    .use(router.routes())
    .use(router.allowedMethods())
    .use(async (ctx: Koa.Context) => {
      ctx.status = 404;
      ctx.body = {
        message: 'Not found',
        status: 404
      };
    });
  return app;
};
