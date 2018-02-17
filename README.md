# contentjet-api

![license](https://img.shields.io/github/license/mashape/apistatus.svg?style=flat-square)

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
```

### 2. Configuration

The app is configurable through the use of environment variables. For a complete list of all options refer to `src/config/index.ts`. While _most_ options have default fallbacks you will need to provide values for the following:

#### Secret key

Secret key is used in the hashing of passwords and tokens. You must supply a random string to this value and be sure to keep it secret!

```
SECRET_KEY=yoursupersecretkey
```

#### Database

Database connection settings. Note only PostgreSQL 9.5+ is supported.

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=contentjet-api
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
```

#### URLs

The application needs to know where it's hosted.

FRONTEND_URL is the url hosting [contentjet-ui][contentjet-ui].

```
FRONTEND_URL=https://example.com
```

BACKEND_URL is the url hosting _this_ application ([contentjet-api][contentjet-api]).

```
BACKEND_URL=https://api.example.com
```

#### Mail

You MUST provide the following SMTP settings for email sending.

```
MAIL_FROM=noreply@your-domain.com
SMTP_HOST=your-smtp-host
SMTP_PORT=your-smtp-host-port
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
```

Environment variables can either be exported directly or you may optionally create a `.env` file in the root of the repository and specify them there. Note any _exported_ variables will take precedence over those defined in `.env`. See [dotenv](https://github.com/motdotla/dotenv) for more details.

### 3. Database migration

Run the following command to create the required tables in your database.

```
npm run migrate
```

### 4. Create application administrator

You must create at least one administrator user.

```
npm run create-admin-user
```

### 5. Run

Start the server.

```
npm start
```

## Development

To run the app in development you must install _all_ dependencies by running `npm install`.

Once you have migrated your database, configured a mail backend and created an administrator (see Quick Start above) you can start the development server by running `npm run dev`. Alternatively, run a one-off build with `npm run build`.

[contentjet-ui]: https://github.com/contentjet/contentjet-ui
[contentjet-api]: https://github.com/contentjet/contentjet-api
