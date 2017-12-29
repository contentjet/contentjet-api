import path = require('path');

const config = require('./config');
const MailBackend = require(config.MAIL_BACKEND).default;
const StorageBackend = require(config.STORAGE_BACKEND).default;
import * as Koa from 'koa';
const bodyParser = require('koa-bodyparser');
const cors = require('kcors');
const send = require('koa-send');
const router = require('koa-router')();
import {Model, ValidationError as ObjectionValidationError} from 'objection';
Model.knex(require('knex')(config.DATABASE));
import {get, pick} from 'lodash';
import axios from 'axios';
const jwt = require('jsonwebtoken');
const yaml = require('yamljs');

import ProjectViewSet = require('./viewsets/ProjectViewSet');
import UserViewSet = require('./viewsets/UserViewSet');
import WebHookViewSet = require('./viewsets/WebHookViewSet');
import ProjectInviteViewSet = require('./viewsets/ProjectInviteViewSet');
import MediaViewSet = require('./viewsets/MediaViewSet');
import MediaTagViewSet = require('./viewsets/MediaTagViewSet');
import EntryTypeViewSet = require('./viewsets/EntryTypeViewSet');
import EntryViewSet = require('./viewsets/EntryViewSet');
import EntryTagViewSet = require('./viewsets/EntryTagViewSet');

// import Project from './models/Project';
// import WebHook from './models/WebHook';

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
import ValidationError from './errors/ValidationError';
import AuthenticationError from './errors/AuthenticationError';

// Instantiate storage backend and expose on context prototype
const storage = new StorageBackend();

const viewSetOptions = { storage };

// Load the OpenAPI spec from disk converting YAML to JSON
const spec = yaml.load('spec.yml');

// Attach routes
router.use('/user/', new UserViewSet(viewSetOptions).routes());
router.use('/project/:projectId(\\d+)/', async (ctx: Koa.Context, next: Function) => {
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
router.get('/spec', function (ctx: Koa.Context) {
  ctx.body = spec;
});

const app = new Koa();

// Instantiate mail backend and expose sendMail method on context prototype
const mailBackend = new MailBackend();
app.context.sendMail = mailBackend.sendMail;

interface IWebHookEventPayload {
  dateTime: Date;
  project: Object;
  webHook: Object;
  target: number[] | number;
}

app
  .use(cors())
  .use(async (ctx: Koa.Context, next: Function) => {
    try {
      await next();
      // Catch Koa's stadard 404 response and throw our own error
      if (ctx.response.status === 404) throw new NotFoundError();
    } catch (err) {
      if (err instanceof ObjectionValidationError) {
        let e = new ValidationError();
        e.errors = err.data;
        ctx.body = e;
        ctx.status = e.status;
      } else if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
        let e = new AuthenticationError(err.message);
        ctx.body = e;
        ctx.status = e.status;
      } else {
        ctx.status = err.status || err.statusCode || 500;
        ctx.body = err;
      }
      if (config.DEBUG) console.log(err.stack);
    }
  })
  .use(async (ctx: Koa.Context, next: Function) => {
    await next();
    const {project, viewsetResult} = ctx.state;
    if (!viewsetResult || !project) return;
    const {modelClass, action, data} = viewsetResult;
    const actionToEventMap: {[index:string]: string} = {
      'update': 'Updated',
      'create': 'Created',
      'delete': 'Deleted',
      'bulkDelete': 'BulkDeleted'
    };
    const actions = Object.keys(actionToEventMap);
    if (!actions.includes(action)) return;
    const webHooks = await project.getActiveWebHooks();
    webHooks.forEach(async (webHook: WebHook) => {
      for (const action of actions) {
        const event = `${modelClass.tableName}${actionToEventMap[action]}`;
        if (!get(webHook, event)) continue;
        // For bulkDelete action data is an array of the deleted record ids
        const payload: IWebHookEventPayload = {
          dateTime: new Date(),
          project: pick(project, ['id', 'name']),
          webHook: pick(webHook, ['id', 'name', 'url']),
          target: actionToEventMap[action] === 'BulkDeleted' ? data : pick(data, 'id')
        };
        try {
          await axios.post(webHook.url, payload);
        } catch (err) {
          // TODO: Log error
        }
      }
    });
  });

if (config.SERVE_MEDIA) {
  app.use(
    async (ctx: Koa.Context, next: Function) => {
      if (ctx.path.match(/^\/media\/.*$/)) {
        await send(ctx, path.join(config.MEDIA_ROOT, ctx.path.replace('/media/', '')));
      } else {
        await next();
      }
    }
  );
}

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

export default app;
export { default as Entry } from './models/Entry';
export { default as EntryTag } from './models/EntryTag';
export { default as EntryType } from './models/EntryType';
export { default as Media } from './models/Media';
export { default as MediaTag } from './models/MediaTag';
export { default as Permission } from './models/Permission';
export { default as Project } from './models/Project';
export { default as ProjectInvite } from './models/ProjectInvite';
export { default as ProjectMembership } from './models/ProjectMembership';
export { default as Role } from './models/Role';
export { default as User } from './models/User';
export { default as WebHook } from './models/WebHook';
export const models = {
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
