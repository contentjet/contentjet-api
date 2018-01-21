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
