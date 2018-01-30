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

### 2. Configuration

The app is configurable through the use of environment variables. For a complete list of all options refer to `src/config/index.ts`. While _most_ options have default fallbacks you will need to provide values for the following:

#### Secret key

Secret key is used in the hashing of passwords and tokens. You must supply a random string to this value and be sure to keep it secret!

```
SECRET_KEY=yoursupersecretkey
```

#### Database

Database connection settings. Note only PostgreSQL is supported.

```
DB_HOST=localhost
DB_NAME=contentjet-api
DB_USER=postgres
DB_PASS=password
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

A mail backend **must** be configured. There are 2 backends out-of-the-box, [Mailgun](https://www.mailgun.com/) (recommended) or SMTP. Each mail backend is simply a thin wrapper around [nodemailer](https://nodemailer.com). Depending on which backend you choose you will need to set the following variables.

##### MailGun

```
MAIL_BACKEND=mailgun
MAIL_FROM=noreply@your-domain.com
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=your-domain
```

##### SMTP

```
MAIL_BACKEND=smtp
MAIL_FROM=noreply@your-domain.com
SMTP_HOST=your-smtp-host
SMTP_PORT=your-smtp-host-port
SMTP_AUTH_USER=your-smtp-user
SMTP_AUTH_PASS=your-smtp-pass
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
