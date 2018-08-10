# 0.17.1
* Added 2x missing query params entry list in swagger spec
* Fixed error when updating project

# 0.17.0
* Changed IStorageBackend
* Fixed issue with rendering swagger ui

# 0.16.0
* Storage interface no longer exposes middleware and now has a more explicit `write` method
* Moved some middleware out off app.ts into their own modules
* Storage and Mail backends are now configurable via environment variables and loaded and instantiated dynamically at run-time
* Mail backend is now dependency injected into viewsets via options object
* Removed PERMISSIONS_BACKEND option from config
* Changed config so all top-level keys are scalars
* Updated packages flagged by `npm audit`, notably MJML upgraded from v3 to v4 and templates migrated

# 0.15.3
* Fixing poor response performance when using webhooks

# 0.15.2
* Better sanitising of data when creating entries

# 0.15.1
* Minor bug fix

# 0.15.0
* Added tslint and fixed several minor syntax issues
* Fixed incorrect Entry path in spec.yml
* App config now implements IConfig interface

# 0.14.0
* Fixed incorrect URLs in spec.yml
* Upgraded libraries
* sendMail no longer attached directly to Koa context as Typescript complains (rightfully so)
* Renamed IMailService to IMailBackend
* Added Swagger UI at `/swagger/`
* Added IConfig interface which the app config now implements

# 0.13.0
* Added new Client model for authenticating using OAuth2 Client Credentials flow
* Updated spec.yml
* `/user/authenticate` moved to `/authenticate`
* `/user/token-refresh` moved to `/token-refresh`

# 0.12.0
* Updated spec.yml
* Only admins can create projects

# 0.11.1
* Improved Entry validation

# 0.11.0
* Moved webhook middleware to it's own module and updated payload structure
* Camel cased ProjectMembership table name to be consistent with all other tables
* Updates to spec.yml

# 0.10.0
* Now validating grant_type value, not just it's presence
* Default TOKEN_EXPIRY is 300 (5 minutes)
* Link fields now only show a subset of Entry fields

# 0.9.3
* Saving an entry with a disabled field no longer destroys the disabled field's value

# 0.9.2
* Fixed issue in array length validator
* Fixed test.sh referencing old environment variables

# 0.9.1
* Added /robots.txt route
* Added cache header to /spec route
* Added change-password endpoint
* Removed mailgun transport

# 0.8.0
* Fixed issue where cors config was not being passed to middleware
* Renamed CORS environment variable CORS_ORIGIN

# 0.7.1
* Updated README

# 0.7.0
* Renamed database environment variables

# 0.6.0
* Entries list endpoint now supports `orderBy` parameter
* Media list endpoint now supports `orderBy` parameter

# 0.5.0
* Config is now loaded from environment variables, removed postinstall script
* Added required BACKEND_URL config variable. This value will be injected into the OpenAPI _servers_ block visible at `/spec`.
* Added optional DB_PORT config variable
* Added Dockerfile and docker-start.sh
* Added EntryType integration test
* Tests are now ran using Docker with `./test.sh`

# 0.4.0
* All foreign keys now CASCADE on delete
* Fixed issued with Entry.bulkDelete causing database error
* Added Entry tests
* Fixed missing createdAt and modifiedAt fields from EntryType schema
* Added vertical spacing to email templates main section
* `npm test` now runs `npm run build` before running tests

# 0.3.1
* Build output no longer gitignored

# 0.3.0
* Codebase converted to Typescript
* Backends are no longer specified as paths in the config, rather they
are instantiated and attached directly the config object
* Improved README

# 0.2.0
* Added OpenAPI 3.0 specification at `/spec`
* The `create-admin-user` script now correctly creates the user with `isAdmin=true`
* Update endpoints should now correctly return 404 if record doesn't exist
* WebHook and ProjectInvite list endpoints are no longer paginated

# 0.1.0
* First public release
