"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const knex = require("knex");
const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const cors = require("kcors");
const Router = require("koa-router");
const objection_1 = require("objection");
objection_1.Model.knex(knex({
    client: 'postgresql',
    connection: {
        host: config_1.default.POSTGRES_HOST,
        port: config_1.default.POSTGRES_PORT,
        database: config_1.default.POSTGRES_DB,
        user: config_1.default.POSTGRES_USER,
        password: config_1.default.POSTGRES_PASSWORD
    },
    pool: {
        min: config_1.default.POSTGRES_POOL_MIN,
        max: config_1.default.POSTGRES_POOL_MAX
    },
    migrations: {
        tableName: 'knex_migrations'
    }
}));
const yaml = require("yamljs");
const routes_1 = require("./authentication/jwt/routes");
const middleware_1 = require("./authentication/jwt/middleware");
const ProjectViewSet_1 = require("./viewsets/ProjectViewSet");
const UserViewSet_1 = require("./viewsets/UserViewSet");
const ClientViewSet_1 = require("./viewsets/ClientViewSet");
const WebHookViewSet_1 = require("./viewsets/WebHookViewSet");
const ProjectInviteViewSet_1 = require("./viewsets/ProjectInviteViewSet");
const MediaViewSet_1 = require("./viewsets/MediaViewSet");
const MediaTagViewSet_1 = require("./viewsets/MediaTagViewSet");
const EntryTypeViewSet_1 = require("./viewsets/EntryTypeViewSet");
const EntryViewSet_1 = require("./viewsets/EntryViewSet");
const EntryTagViewSet_1 = require("./viewsets/EntryTagViewSet");
const Client_1 = require("./models/Client");
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
const webhooks_1 = require("./middleware/webhooks");
const errors_1 = require("./middleware/errors");
const serveMedia_1 = require("./middleware/serveMedia");
const swaggerUI_1 = require("./middleware/swaggerUI");
exports.models = {
    Client: Client_1.default,
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
const initStorageBackend = async () => {
    const { default: storageClass } = await Promise.resolve().then(() => require(config_1.default.STORAGE_BACKEND));
    return new storageClass();
};
const initMailBackend = async () => {
    const { default: mailClass } = await Promise.resolve().then(() => require(config_1.default.MAIL_BACKEND));
    return new mailClass();
};
const initRootRouter = (storage, mail) => {
    const viewSetOptions = { storage, mail };
    // Instantiate root router and attach routes
    const router = new Router();
    router.post('/authenticate', routes_1.authenticateUser);
    router.post('/token-refresh', middleware_1.requireAuthentication, routes_1.tokenRefresh);
    router.use('/user/', new UserViewSet_1.default(viewSetOptions).routes());
    router.use('/project/:projectId(\\d+)/', async (ctx, next) => {
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
    router.use('/project/:projectId(\\d+)/client/', new ClientViewSet_1.default(viewSetOptions).routes());
    // Load the OpenAPI spec from disk converting YAML to JSON and dynamically populating
    // the servers array with our config.BACKEND_URL.
    const spec = yaml.load('spec.yml');
    if (!spec.servers)
        spec.servers = [];
    spec.servers.push({ url: config_1.default.BACKEND_URL });
    router.get('/spec', (ctx) => {
        ctx.set('Cache-Control', 'max-age=604800');
        ctx.body = spec;
    });
    // robots.txt
    router.get('/robots.txt', (ctx) => {
        ctx.set('Cache-Control', 'max-age=604800');
        ctx.body = 'User-agent: *\nDisallow: /';
    });
    return router;
};
exports.default = async () => {
    const storage = await initStorageBackend();
    const mail = await initMailBackend();
    const router = initRootRouter(storage, mail);
    const app = new Koa();
    app
        .use(cors({ origin: config_1.default.CORS_ORIGIN }))
        .use(errors_1.default)
        .use(webhooks_1.default);
    if (config_1.default.SERVE_MEDIA)
        app.use(serveMedia_1.default);
    if (config_1.default.SERVE_SWAGGER_UI)
        app.use(swaggerUI_1.default());
    app
        .use(bodyParser())
        .use(router.routes())
        .use(router.allowedMethods())
        .use(async (ctx) => {
        ctx.status = 404;
        ctx.body = {
            message: 'Not found',
            status: 404
        };
    });
    return app;
};
