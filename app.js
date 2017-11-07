const path = require('path');

const config = require('./config');
const MailBackend = require(config.MAIL_BACKEND);
const StorageBackend = require(config.STORAGE_BACKEND);
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('kcors');
const send = require('koa-send');
const router = require('koa-router')();
const Model = require('objection').Model;
const ObjectionValidationError = require('objection').ValidationError;
Model.knex(require('knex')(config.DATABASE));
const _ = require('lodash');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const ProjectViewSet = require('./viewsets/ProjectViewSet');
const UserViewSet = require('./viewsets/UserViewSet');
const WebHookViewSet = require('./viewsets/WebHookViewSet');
const ProjectInviteViewSet = require('./viewsets/ProjectInviteViewSet');
const MediaViewSet = require('./viewsets/MediaViewSet');
const MediaTagViewSet = require('./viewsets/MediaTagViewSet');
const EntryTypeViewSet = require('./viewsets/EntryTypeViewSet');
const EntryViewSet = require('./viewsets/EntryViewSet');
const EntryTagViewSet = require('./viewsets/EntryTagViewSet');

const Entry = require('./models/Entry');
const EntryTag = require('./models/EntryTag');
const EntryType = require('./models/EntryType');
const Media = require('./models/Media');
const MediaTag = require('./models/MediaTag');
const Permission = require('./models/Permission');
const Project = require('./models/Project');
const ProjectInvite = require('./models/ProjectInvite');
const Role = require('./models/Role');
const User = require('./models/User');
const WebHook = require('./models/WebHook');

const NotFoundError = require('./errors/NotFoundError');
const ValidationError = require('./errors/ValidationError');
const AuthenticationError = require('./errors/AuthenticationError');

// Instantiate storage backend and expose on context prototype
const storage = new StorageBackend();

const viewSetOptions = { storage };

router.use('/user/', new UserViewSet(viewSetOptions).routes());
router.use('/project/:projectId(\\d+)/', async (ctx, next) => {
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


const app = new Koa();

// Instantiate mail backend and expose sendMail method on context prototype
const mailBackend = new MailBackend();
app.context.sendMail = mailBackend.sendMail;

// Attach our models to the app instance
app.models = {
  Entry,
  EntryTag,
  EntryType,
  Media,
  MediaTag,
  Permission,
  Project,
  ProjectInvite,
  Role,
  User,
  WebHook
};

app
  .use(cors())
  .use(async (ctx, next) => {
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
  .use(async (ctx, next) => {
    await next();
    const {project, viewsetResult} = ctx.state;
    if (!viewsetResult || !project) return;
    const {modelClass, action, data} = viewsetResult;
    const actionToEventMap = {
      'update': 'Updated',
      'create': 'Created',
      'delete': 'Deleted',
      'bulkDelete': 'BulkDeleted'
    };
    const actions = Object.keys(actionToEventMap);
    if (!actions.includes(action)) return;
    const webHooks = await project.getActiveWebHooks();
    webHooks.forEach(async (webHook) => {
      for (let action of actions) {
        let event = `${modelClass.tableName}${actionToEventMap[action]}`;
        if (!_.get(webHook, event)) continue;
        let payload = {
          dateTime: new Date(),
          project: _.pick(project, ['id', 'name']),
          webHook: _.pick(webHook, ['id', 'name', 'url']),
        };
        // For bulkDelete action data is an array of the deleted record ids
        if (actionToEventMap[action] === 'BulkDeleted') {
          payload.target = data;
        } else {
          payload.target = _.pick(data, 'id');
        }
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
    async (ctx, next) => {
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
  .use(async (ctx, next) => {
    ctx.status = 404;
    ctx.body = {
      message: 'Not found',
      status: 404
    };
  });

module.exports = app;
