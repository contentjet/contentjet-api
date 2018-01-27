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
