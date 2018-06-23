"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createUserTable(_knex) {
    return _knex.schema.createTableIfNotExists('user', (table) => {
        table.increments();
        table.string('email').unique();
        table.string('password', 64);
        table.string('name', 128);
        table.boolean('isActive').defaultTo(false);
        table.boolean('isAdmin').defaultTo(false);
        table.timestamp('createdAt').defaultTo(_knex.fn.now());
        table.timestamp('modifiedAt').defaultTo(_knex.fn.now());
    });
}
function createProjectTable(_knex) {
    return _knex.schema.createTableIfNotExists('project', (table) => {
        table.increments();
        table.string('name', 128);
        table.text('metadata').defaultTo('');
        table.integer('userId').unsigned();
        table.timestamp('createdAt').defaultTo(_knex.fn.now());
        table.timestamp('modifiedAt').defaultTo(_knex.fn.now());
        // Constraints
        table.foreign('userId').references('user.id').onDelete('CASCADE');
    });
}
function createProjectMembershipTable(_knex) {
    return _knex.schema.createTableIfNotExists('projectMembership', (table) => {
        table.integer('userId').unsigned();
        table.integer('projectId').unsigned();
        table.string('membershipType', 128);
        table.boolean('membershipIsActive').defaultTo(true);
        // Constraints
        table.foreign('userId').references('user.id').onDelete('CASCADE');
        table.foreign('projectId').references('project.id').onDelete('CASCADE');
        table.primary(['userId', 'projectId']);
    });
}
function createWebhookTable(_knex) {
    return _knex.schema.createTableIfNotExists('webHook', (table) => {
        table.increments();
        table.integer('projectId').unsigned();
        table.string('name', 128);
        table.boolean('isActive').defaultTo(false);
        table.string('url', 512);
        table.boolean('projectUpdated').defaultTo(false);
        table.boolean('projectDeleted').defaultTo(false);
        table.boolean('entryTypeCreated').defaultTo(false);
        table.boolean('entryTypeUpdated').defaultTo(false);
        table.boolean('entryTypeDeleted').defaultTo(false);
        table.boolean('entryCreated').defaultTo(false);
        table.boolean('entryUpdated').defaultTo(false);
        table.boolean('entryDeleted').defaultTo(false);
        table.boolean('entryDeletedBulk').defaultTo(false);
        table.boolean('mediaCreated').defaultTo(false);
        table.boolean('mediaUpdated').defaultTo(false);
        table.boolean('mediaDeleted').defaultTo(false);
        table.boolean('mediaDeletedBulk').defaultTo(false);
        table.timestamp('createdAt').defaultTo(_knex.fn.now());
        table.timestamp('modifiedAt').defaultTo(_knex.fn.now());
        // Constraints
        table.foreign('projectId').references('project.id').onDelete('CASCADE');
    });
}
function createProjectinviteTable(_knex) {
    return _knex.schema.createTableIfNotExists('projectInvite', (table) => {
        table.increments();
        table.integer('projectId').unsigned();
        table.string('name', 128);
        table.string('email');
        table.integer('userId').unsigned();
        table.boolean('accepted').defaultTo(false);
        table.timestamp('createdAt').defaultTo(_knex.fn.now());
        table.timestamp('modifiedAt').defaultTo(_knex.fn.now());
        // Constraints
        table.foreign('projectId').references('project.id');
        table.foreign('userId').references('user.id');
    });
}
function createMediatagTable(_knex) {
    return _knex.schema.createTableIfNotExists('mediaTag', (table) => {
        table.increments();
        table.integer('projectId').unsigned();
        table.string('name', 128);
        // Constraints
        table.foreign('projectId').references('project.id');
        table.unique(['projectId', 'name']);
    });
}
function createMediaTable(_knex) {
    return _knex.schema.createTableIfNotExists('media', (table) => {
        table.increments();
        table.integer('projectId').unsigned();
        table.integer('userId').unsigned();
        table.string('name', 128);
        table.string('file', 512);
        table.string('thumbnail', 512);
        table.string('mimeType', 128);
        table.integer('size').unsigned();
        table.integer('width').unsigned();
        table.integer('height').unsigned();
        table.text('description').defaultTo('');
        table.timestamp('createdAt').defaultTo(_knex.fn.now());
        table.timestamp('modifiedAt').defaultTo(_knex.fn.now());
        // Constraints
        table.foreign('projectId').references('project.id').onDelete('CASCADE');
        table.foreign('userId').references('user.id').onDelete('CASCADE');
    });
}
function createMedia_MediatagTable(_knex) {
    return _knex.schema.createTableIfNotExists('media_mediaTag', (table) => {
        table.integer('mediaId').unsigned();
        table.integer('mediaTagId').unsigned();
        // Constraints
        table.foreign('mediaId').references('media.id').onDelete('CASCADE');
        table.foreign('mediaTagId').references('mediaTag.id').onDelete('CASCADE');
        table.primary(['mediaId', 'mediaTagId']);
    });
}
function createEntrytypeTable(_knex) {
    return _knex.schema.createTableIfNotExists('entryType', (table) => {
        table.increments();
        table.integer('projectId').unsigned();
        table.integer('userId').unsigned();
        table.string('name', 128);
        table.text('metadata').defaultTo('');
        table.string('description', 128).defaultTo('');
        table.jsonb('fields');
        table.timestamp('createdAt').defaultTo(_knex.fn.now());
        table.timestamp('modifiedAt').defaultTo(_knex.fn.now());
        // Constraints
        table.foreign('projectId').references('project.id').onDelete('CASCADE');
        table.foreign('userId').references('user.id').onDelete('CASCADE');
    });
}
function createEntrytagTable(_knex) {
    return _knex.schema.createTableIfNotExists('entryTag', (table) => {
        table.increments();
        table.integer('projectId').unsigned();
        table.string('name', 128);
        // Constraints
        table.foreign('projectId').references('project.id').onDelete('CASCADE');
        table.unique(['projectId', 'name']);
    });
}
function createEntryTable(_knex) {
    return _knex.schema.createTableIfNotExists('entry', (table) => {
        table.increments();
        table.integer('entryTypeId').unsigned();
        table.integer('userId').unsigned();
        table.integer('modifiedByUserId').unsigned();
        table.string('name', 128);
        table.timestamp('published');
        table.jsonb('fields');
        table.timestamp('createdAt').defaultTo(_knex.fn.now());
        table.timestamp('modifiedAt').defaultTo(_knex.fn.now());
        // Constraints
        table.foreign('entryTypeId').references('entryType.id').onDelete('CASCADE');
        table.foreign('userId').references('user.id').onDelete('CASCADE');
        table.foreign('modifiedByUserId').references('user.id').onDelete('CASCADE');
    });
}
function createEntry_EntrytagTable(_knex) {
    return _knex.schema.createTableIfNotExists('entry_entryTag', (table) => {
        table.integer('entryId').unsigned();
        table.integer('entryTagId').unsigned();
        // Constraints
        table.foreign('entryId').references('entry.id').onDelete('CASCADE');
        table.foreign('entryTagId').references('entryTag.id').onDelete('CASCADE');
        table.primary(['entryId', 'entryTagId']);
    });
}
function createPermissionTable(_knex) {
    return _knex.schema.createTableIfNotExists('permission', (table) => {
        table.increments();
        table.string('name', 128).unique();
    });
}
function createRoleTable(_knex) {
    return _knex.schema.createTableIfNotExists('role', (table) => {
        table.increments();
        table.string('name', 128).unique();
    });
}
function createRole_PermissionTable(_knex) {
    return _knex.schema.createTableIfNotExists('role_permission', (table) => {
        table.integer('roleId').unsigned();
        table.integer('permissionId').unsigned();
        // Constraints
        table.foreign('roleId').references('role.id').onDelete('CASCADE');
        table.foreign('permissionId').references('permission.id').onDelete('CASCADE');
        table.primary(['roleId', 'permissionId']);
    });
}
function createUser_RoleTable(_knex) {
    return _knex.schema.createTableIfNotExists('user_role', (table) => {
        table.integer('userId').unsigned();
        table.integer('roleId').unsigned();
        // Constraints
        table.foreign('userId').references('user.id').onDelete('CASCADE');
        table.foreign('roleId').references('role.id').onDelete('CASCADE');
        table.primary(['userId', 'roleId']);
    });
}
exports.up = (_knex) => {
    return createUserTable(_knex)
        .then(() => createProjectTable(_knex))
        .then(() => createProjectMembershipTable(_knex))
        .then(() => createWebhookTable(_knex))
        .then(() => createProjectinviteTable(_knex))
        .then(() => createMediatagTable(_knex))
        .then(() => createMediaTable(_knex))
        .then(() => createMedia_MediatagTable(_knex))
        .then(() => createEntrytypeTable(_knex))
        .then(() => createEntrytagTable(_knex))
        .then(() => createEntryTable(_knex))
        .then(() => createEntry_EntrytagTable(_knex))
        .then(() => createPermissionTable(_knex))
        .then(() => createRoleTable(_knex))
        .then(() => createRole_PermissionTable(_knex))
        .then(() => createUser_RoleTable(_knex));
};
exports.down = (_knex) => {
    const tables = [
        'user',
        'project',
        'projectMembership',
        'webHook',
        'projectInvite',
        'mediaTag',
        'media',
        'media_mediaTag',
        'entryType',
        'entryTag',
        'entry',
        'entry_entryTag',
        'permission',
        'role',
        'role_permission',
        'user_role'
    ];
    return tables.reduce((promise, tableName) => {
        return promise.then(() => {
            return _knex.raw(`DROP TABLE "${tableName}" CASCADE`);
        });
    }, Promise.resolve());
};
