# contentjet-api

A Node based back end for contentjet, a powerful headless API-first CMS. Built with [Koa](http://koajs.com/), [Objection](http://vincit.github.io/objection.js/) and [PostgreSQL](https://www.postgresql.org/).

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
For example `config.development.js` will be loaded when `NODE_ENV=development`. The environment specific config will be _shallowly_ merged with the default configuration found in `config/config.js`.

Note `config/config.production.js` is created for you automatically with the minimum set of options for you to fill out. Be sure to check out `config/config.js`
to see comments on all possible options.

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
