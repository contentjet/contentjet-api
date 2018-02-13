"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const path = require("path");
const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const cors = require("kcors");
const send = require("koa-send");
const Router = require("koa-router");
const objection_1 = require("objection");
objection_1.Model.knex(require('knex')(config_1.default.DATABASE));
const lodash_1 = require("lodash");
const axios_1 = require("axios");
const jwt = require("jsonwebtoken");
const yaml = require("yamljs");
const ProjectViewSet_1 = require("./viewsets/ProjectViewSet");
const UserViewSet_1 = require("./viewsets/UserViewSet");
const WebHookViewSet_1 = require("./viewsets/WebHookViewSet");
const ProjectInviteViewSet_1 = require("./viewsets/ProjectInviteViewSet");
const MediaViewSet_1 = require("./viewsets/MediaViewSet");
const MediaTagViewSet_1 = require("./viewsets/MediaTagViewSet");
const EntryTypeViewSet_1 = require("./viewsets/EntryTypeViewSet");
const EntryViewSet_1 = require("./viewsets/EntryViewSet");
const EntryTagViewSet_1 = require("./viewsets/EntryTagViewSet");
const Entry_1 = require("./models/Entry");
const EntryTag_1 = require("./models/EntryTag");
const EntryType_1 = require("./models/EntryType");
const Media_1 = require("./models/Media");
const MediaTag_1 = require("./models/MediaTag");
const Permission_1 = require("./models/Permission");
const Project_1 = require("./models/Project");
const ProjectInvite_1 = require("./models/ProjectInvite");
const ProjectMembership_1 = require("./models/ProjectMembership");
const Role_1 = require("./models/Role");
const User_1 = require("./models/User");
const WebHook_1 = require("./models/WebHook");
const NotFoundError_1 = require("./errors/NotFoundError");
const ValidationError_1 = require("./errors/ValidationError");
const AuthenticationError_1 = require("./errors/AuthenticationError");
// Attach it to the viewSetOptions
const viewSetOptions = {
    storage: config_1.default.STORAGE_BACKEND
};
// Instantiate root router and attach routes
const router = new Router();
router.use('/user/', new UserViewSet_1.default(viewSetOptions).routes());
router.use('/project/:projectId(\\d+)/', async function (ctx, next) {
    const project = await Project_1.default.getById(ctx.params.projectId);
    if (!project)
        throw new NotFoundError_1.default();
    ctx.state.project = project;
    await next();
});
router.use('/project/', new ProjectViewSet_1.default(viewSetOptions).routes());
router.use('/project/:projectId(\\d+)/web-hook/', new WebHookViewSet_1.default(viewSetOptions).routes());
router.use('/project/:projectId(\\d+)/invite/', new ProjectInviteViewSet_1.default(viewSetOptions).routes());
router.use('/project/:projectId(\\d+)/media/', new MediaViewSet_1.default(viewSetOptions).routes());
router.use('/project/:projectId(\\d+)/media-tag/', new MediaTagViewSet_1.default(viewSetOptions).routes());
router.use('/project/:projectId(\\d+)/entry-type/', new EntryTypeViewSet_1.default(viewSetOptions).routes());
router.use('/project/:projectId(\\d+)/entry-tag/', new EntryTagViewSet_1.default(viewSetOptions).routes());
router.use('/project/:projectId(\\d+)/entry/', new EntryViewSet_1.default(viewSetOptions).routes());
// Load the OpenAPI spec from disk converting YAML to JSON and dynamically populating
// the servers array with our config.BACKEND_URL.
const spec = yaml.load('spec.yml');
if (!spec.servers)
    spec.servers = [];
spec.servers.push({ url: config_1.default.BACKEND_URL });
router.get('/spec', function (ctx) {
    ctx.set('Cache-Control', 'max-age=604800');
    ctx.body = spec;
});
// robots.txt
router.get('/robots.txt', function (ctx) {
    ctx.set('Cache-Control', 'max-age=604800');
    ctx.body = 'User-agent: *\nDisallow: /';
});
const app = new Koa();
// Expose sendMail method on context prototype
app.context.sendMail = config_1.default.MAIL_BACKEND.sendMail;
app
    .use(cors(config_1.default.CORS))
    .use(async function (ctx, next) {
    try {
        await next();
        // Catch Koa's stadard 404 response and throw our own error
        if (ctx.response.status === 404)
            throw new NotFoundError_1.default();
    }
    catch (err) {
        if (err instanceof objection_1.ValidationError) {
            let e = new ValidationError_1.default();
            e.errors = err.data;
            ctx.body = e;
            ctx.status = e.status;
        }
        else if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
            let e = new AuthenticationError_1.default(err.message);
            ctx.body = e;
            ctx.status = e.status;
        }
        else {
            ctx.status = err.status || err.statusCode || 500;
            ctx.body = err;
        }
        if (config_1.default.DEBUG)
            console.log(err.stack);
    }
})
    .use(async function (ctx, next) {
    await next();
    const { project, viewsetResult } = ctx.state;
    if (!viewsetResult || !project)
        return;
    const { modelClass, action, data } = viewsetResult;
    const actionToEventMap = {
        'update': 'Updated',
        'create': 'Created',
        'delete': 'Deleted',
        'bulkDelete': 'BulkDeleted'
    };
    const actions = Object.keys(actionToEventMap);
    if (!actions.includes(action))
        return;
    const webHooks = await project.getActiveWebHooks();
    webHooks.forEach(async (webHook) => {
        for (const action of actions) {
            const event = `${modelClass.tableName}${actionToEventMap[action]}`;
            if (!lodash_1.get(webHook, event))
                continue;
            // For bulkDelete action data is an array of the deleted record ids
            const payload = {
                dateTime: new Date(),
                project: lodash_1.pick(project, ['id', 'name']),
                webHook: lodash_1.pick(webHook, ['id', 'name', 'url']),
                target: actionToEventMap[action] === 'BulkDeleted' ? data : lodash_1.pick(data, 'id')
            };
            try {
                await axios_1.default.post(webHook.url, payload);
            }
            catch (err) {
                // TODO: Log error
            }
        }
    });
});
if (config_1.default.SERVE_MEDIA) {
    app.use(async function (ctx, next) {
        if (ctx.path.match(/^\/media\/.*$/)) {
            await send(ctx, path.join(config_1.default.MEDIA_ROOT, ctx.path.replace('/media/', '')));
        }
        else {
            await next();
        }
    });
}
app
    .use(bodyParser())
    .use(router.routes())
    .use(router.allowedMethods())
    .use(async function (ctx) {
    ctx.status = 404;
    ctx.body = {
        message: 'Not found',
        status: 404
    };
});
exports.default = app;
exports.models = {
    Entry: Entry_1.default,
    EntryTag: EntryTag_1.default,
    EntryType: EntryType_1.default,
    Media: Media_1.default,
    MediaTag: MediaTag_1.default,
    Permission: Permission_1.default,
    Project: Project_1.default,
    ProjectInvite: ProjectInvite_1.default,
    ProjectMembership: ProjectMembership_1.default,
    Role: Role_1.default,
    User: User_1.default,
    WebHook: WebHook_1.default
};
