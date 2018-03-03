import * as knex from 'knex';

function createUserTable(knex: knex) {
  return knex.schema.createTableIfNotExists('user', function (table: knex.CreateTableBuilder) {
    table.increments();
    table.string('email').unique();
    table.string('password', 64);
    table.string('name', 128);
    table.boolean('isActive').defaultTo(false);
    table.boolean('isAdmin').defaultTo(false);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('modifiedAt').defaultTo(knex.fn.now());
  });
}

function createProjectTable(knex: knex) {
  return knex.schema.createTableIfNotExists('project', function (table: knex.CreateTableBuilder) {
    table.increments();
    table.string('name', 128);
    table.text('metadata').defaultTo('');
    table.integer('userId').unsigned();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('modifiedAt').defaultTo(knex.fn.now());
    // Constraints
    table.foreign('userId').references('user.id').onDelete('CASCADE');
  });
}

function createProjectMembershipTable(knex: knex) {
  return knex.schema.createTableIfNotExists('projectMembership', function (table: knex.CreateTableBuilder) {
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

function createWebhookTable(knex: knex) {
  return knex.schema.createTableIfNotExists('webHook', function (table: knex.CreateTableBuilder) {
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
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('modifiedAt').defaultTo(knex.fn.now());
    // Constraints
    table.foreign('projectId').references('project.id').onDelete('CASCADE');
  });
}

function createProjectinviteTable(knex: knex) {
  return knex.schema.createTableIfNotExists('projectInvite', function (table: knex.CreateTableBuilder) {
    table.increments();
    table.integer('projectId').unsigned();
    table.string('name', 128);
    table.string('email');
    table.integer('userId').unsigned();
    table.boolean('accepted').defaultTo(false);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('modifiedAt').defaultTo(knex.fn.now());
    // Constraints
    table.foreign('projectId').references('project.id');
    table.foreign('userId').references('user.id');
  });
}

function createMediatagTable(knex: knex) {
  return knex.schema.createTableIfNotExists('mediaTag', function (table: knex.CreateTableBuilder) {
    table.increments();
    table.integer('projectId').unsigned();
    table.string('name', 128);
    // Constraints
    table.foreign('projectId').references('project.id');
    table.unique(['projectId', 'name']);
  });
}

function createMediaTable(knex: knex) {
  return knex.schema.createTableIfNotExists('media', function (table: knex.CreateTableBuilder) {
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
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('modifiedAt').defaultTo(knex.fn.now());
    // Constraints
    table.foreign('projectId').references('project.id').onDelete('CASCADE');
    table.foreign('userId').references('user.id').onDelete('CASCADE');
  });
}

function createMedia_MediatagTable(knex: knex) {
  return knex.schema.createTableIfNotExists('media_mediaTag', function (table: knex.CreateTableBuilder) {
    table.integer('mediaId').unsigned();
    table.integer('mediaTagId').unsigned();
    // Constraints
    table.foreign('mediaId').references('media.id').onDelete('CASCADE');
    table.foreign('mediaTagId').references('mediaTag.id').onDelete('CASCADE');
    table.primary(['mediaId', 'mediaTagId']);
  });
}

function createEntrytypeTable(knex: knex) {
  return knex.schema.createTableIfNotExists('entryType', function (table: knex.CreateTableBuilder) {
    table.increments();
    table.integer('projectId').unsigned();
    table.integer('userId').unsigned();
    table.string('name', 128);
    table.text('metadata').defaultTo('');
    table.string('description', 128).defaultTo('');
    table.jsonb('fields');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('modifiedAt').defaultTo(knex.fn.now());
    // Constraints
    table.foreign('projectId').references('project.id').onDelete('CASCADE');
    table.foreign('userId').references('user.id').onDelete('CASCADE');
  });
}

function createEntrytagTable(knex: knex) {
  return knex.schema.createTableIfNotExists('entryTag', function (table: knex.CreateTableBuilder) {
    table.increments();
    table.integer('projectId').unsigned();
    table.string('name', 128);
    // Constraints
    table.foreign('projectId').references('project.id').onDelete('CASCADE');
    table.unique(['projectId', 'name']);
  });
}

function createEntryTable(knex: knex) {
  return knex.schema.createTableIfNotExists('entry', function (table: knex.CreateTableBuilder) {
    table.increments();
    table.integer('entryTypeId').unsigned();
    table.integer('userId').unsigned();
    table.integer('modifiedByUserId').unsigned();
    table.string('name', 128);
    table.timestamp('published');
    table.jsonb('fields');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('modifiedAt').defaultTo(knex.fn.now());
    // Constraints
    table.foreign('entryTypeId').references('entryType.id').onDelete('CASCADE');
    table.foreign('userId').references('user.id').onDelete('CASCADE');
    table.foreign('modifiedByUserId').references('user.id').onDelete('CASCADE');
  });
}

function createEntry_EntrytagTable(knex: knex) {
  return knex.schema.createTableIfNotExists('entry_entryTag', function (table: knex.CreateTableBuilder) {
    table.integer('entryId').unsigned();
    table.integer('entryTagId').unsigned();
    // Constraints
    table.foreign('entryId').references('entry.id').onDelete('CASCADE');
    table.foreign('entryTagId').references('entryTag.id').onDelete('CASCADE');
    table.primary(['entryId', 'entryTagId']);
  });
}

function createPermissionTable(knex: knex) {
  return knex.schema.createTableIfNotExists('permission', function (table: knex.CreateTableBuilder) {
    table.increments();
    table.string('name', 128).unique();
  });
}

function createRoleTable(knex: knex) {
  return knex.schema.createTableIfNotExists('role', function (table: knex.CreateTableBuilder) {
    table.increments();
    table.string('name', 128).unique();
  });
}

function createRole_PermissionTable(knex: knex) {
  return knex.schema.createTableIfNotExists('role_permission', function (table: knex.CreateTableBuilder) {
    table.integer('roleId').unsigned();
    table.integer('permissionId').unsigned();
    // Constraints
    table.foreign('roleId').references('role.id').onDelete('CASCADE');
    table.foreign('permissionId').references('permission.id').onDelete('CASCADE');
    table.primary(['roleId', 'permissionId']);
  });
}

function createUser_RoleTable(knex: knex) {
  return knex.schema.createTableIfNotExists('user_role', function (table: knex.CreateTableBuilder) {
    table.integer('userId').unsigned();
    table.integer('roleId').unsigned();
    // Constraints
    table.foreign('userId').references('user.id').onDelete('CASCADE');
    table.foreign('roleId').references('role.id').onDelete('CASCADE');
    table.primary(['userId', 'roleId']);
  });
}

exports.up = function(knex: knex) {
  return createUserTable(knex)
    .then(() => createProjectTable(knex))
    .then(() => createProjectMembershipTable(knex))
    .then(() => createWebhookTable(knex))
    .then(() => createProjectinviteTable(knex))
    .then(() => createMediatagTable(knex))
    .then(() => createMediaTable(knex))
    .then(() => createMedia_MediatagTable(knex))
    .then(() => createEntrytypeTable(knex))
    .then(() => createEntrytagTable(knex))
    .then(() => createEntryTable(knex))
    .then(() => createEntry_EntrytagTable(knex))
    .then(() => createPermissionTable(knex))
    .then(() => createRoleTable(knex))
    .then(() => createRole_PermissionTable(knex))
    .then(() => createUser_RoleTable(knex));
};

exports.down = function(knex: knex) {
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
      return knex.raw(`DROP TABLE "${tableName}" CASCADE`);
    });
  }, Promise.resolve());
};
