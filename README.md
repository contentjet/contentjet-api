# contentjet-api

A Node based back end for contentjet, a powerful headless API-first CMS. Built with [Koa](http://koajs.com/), [Objection](http://vincit.github.io/objection.js/) and [PostgreSQL](https://www.postgresql.org/).

Contentjet is composed of 2 discreet applications, the backend API contentjet-api (this repository) and the frontend HTML user interface [contentjet-ui](https://github.com/contentjet/contentjet-ui).

## Requirements

* Node 8+
* NPM 5+
* PostgreSQL 9.5+

## Quick Start

### 1. Installation

```
npm install --production
npm install knex -g
```

#### 2. Configuration

Configuration is resolved at run-time based on the current value of the `NODE_ENV` environment variable.
For example `dist/config/config.production.js` will be loaded when `NODE_ENV=production`. The environment specific config will be _shallowly_ merged with the default configuration found in `dist/config/config.js`.

Note `dist/config/config.production.js` is created for you automatically with the minimum set of options for you to fill out. Be sure to check out `dist/config/config.js` to see comments on all possible options.

#### 3. Database migration

Run the following command to create the required tables in your database.

```
npm run migrate
```

#### 4. Create application administrator

You must create at least one administrator user.

```
npm run create-admin-user
```

#### 5. Run

Start the server.

```
npm start
```

## Development

To run the app in development be sure to set `NODE_ENV=development` and create
a development config file by copying `src/config/config.ts` to `src/config/config.development.ts` making sure to fill in a value for the `SECRET_KEY` property. Once you have migrated your database and created an administrator (see Quick Start above) you can start the development server by running `npm run dev`.
