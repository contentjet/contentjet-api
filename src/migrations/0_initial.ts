import * as knex from 'knex';

async function createUserTable(_knex: knex): Promise<any> {
  const exists = await _knex.schema.hasTable('user');
  if (!exists) {
    return _knex.schema.createTable('user', table => {
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
}

async function createProjectTable(_knex: knex) {
  const exists = await _knex.schema.hasTable('project');
  if (!exists) {
    return _knex.schema.createTable('project', table => {
      table.increments();
      table.string('name', 128);
      table.text('metadata').defaultTo('');
      table.integer('userId').unsigned();
      table.timestamp('createdAt').defaultTo(_knex.fn.now());
      table.timestamp('modifiedAt').defaultTo(_knex.fn.now());
      // Constraints
      table
        .foreign('userId')
        .references('user.id')
        .onDelete('CASCADE');
    });
  }
}

async function createProjectMembershipTable(_knex: knex) {
  const exists = await _knex.schema.hasTable('projectMembership');
  if (!exists) {
    return _knex.schema.createTable('projectMembership', table => {
      table.integer('userId').unsigned();
      table.integer('projectId').unsigned();
      table.string('membershipType', 128);
      table.boolean('membershipIsActive').defaultTo(true);
      // Constraints
      table
        .foreign('userId')
        .references('user.id')
        .onDelete('CASCADE');
      table
        .foreign('projectId')
        .references('project.id')
        .onDelete('CASCADE');
      table.primary(['userId', 'projectId']);
    });
  }
}

async function createWebhookTable(_knex: knex) {
  const exists = await _knex.schema.hasTable('webHook');
  if (!exists) {
    return _knex.schema.createTable('webHook', table => {
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
      table
        .foreign('projectId')
        .references('project.id')
        .onDelete('CASCADE');
    });
  }
}

async function createProjectinviteTable(_knex: knex) {
  const exists = await _knex.schema.hasTable('projectInvite');
  if (!exists) {
    return _knex.schema.createTable('projectInvite', table => {
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
}

async function createMediatagTable(_knex: knex) {
  const exists = await _knex.schema.hasTable('mediaTag');
  if (!exists) {
    return _knex.schema.createTable('mediaTag', table => {
      table.increments();
      table.integer('projectId').unsigned();
      table.string('name', 128);
      // Constraints
      table.foreign('projectId').references('project.id');
      table.unique(['projectId', 'name']);
    });
  }
}

async function createMediaTable(_knex: knex) {
  const exists = await _knex.schema.hasTable('media');
  if (!exists) {
    return _knex.schema.createTable('media', table => {
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
      table
        .foreign('projectId')
        .references('project.id')
        .onDelete('CASCADE');
      table
        .foreign('userId')
        .references('user.id')
        .onDelete('CASCADE');
    });
  }
}

async function createMedia_MediatagTable(_knex: knex) {
  const exists = await _knex.schema.hasTable('media_mediaTag');
  if (!exists) {
    return _knex.schema.createTable('media_mediaTag', table => {
      table.integer('mediaId').unsigned();
      table.integer('mediaTagId').unsigned();
      // Constraints
      table
        .foreign('mediaId')
        .references('media.id')
        .onDelete('CASCADE');
      table
        .foreign('mediaTagId')
        .references('mediaTag.id')
        .onDelete('CASCADE');
      table.primary(['mediaId', 'mediaTagId']);
    });
  }
}

async function createEntrytypeTable(_knex: knex) {
  const exists = await _knex.schema.hasTable('entryType');
  if (!exists) {
    return _knex.schema.createTable('entryType', table => {
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
      table
        .foreign('projectId')
        .references('project.id')
        .onDelete('CASCADE');
      table
        .foreign('userId')
        .references('user.id')
        .onDelete('CASCADE');
    });
  }
}

async function createEntrytagTable(_knex: knex) {
  const exists = await _knex.schema.hasTable('entryTag');
  if (!exists) {
    return _knex.schema.createTable('entryTag', table => {
      table.increments();
      table.integer('projectId').unsigned();
      table.string('name', 128);
      // Constraints
      table
        .foreign('projectId')
        .references('project.id')
        .onDelete('CASCADE');
      table.unique(['projectId', 'name']);
    });
  }
}

async function createEntryTable(_knex: knex) {
  const exists = await _knex.schema.hasTable('entry');
  if (!exists) {
    return _knex.schema.createTable('entry', table => {
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
      table
        .foreign('entryTypeId')
        .references('entryType.id')
        .onDelete('CASCADE');
      table
        .foreign('userId')
        .references('user.id')
        .onDelete('CASCADE');
      table
        .foreign('modifiedByUserId')
        .references('user.id')
        .onDelete('CASCADE');
    });
  }
}

async function createEntry_EntrytagTable(_knex: knex) {
  const exists = await _knex.schema.hasTable('entry_entryTag');
  if (!exists) {
    return _knex.schema.createTable('entry_entryTag', table => {
      table.integer('entryId').unsigned();
      table.integer('entryTagId').unsigned();
      // Constraints
      table
        .foreign('entryId')
        .references('entry.id')
        .onDelete('CASCADE');
      table
        .foreign('entryTagId')
        .references('entryTag.id')
        .onDelete('CASCADE');
      table.primary(['entryId', 'entryTagId']);
    });
  }
}

async function createPermissionTable(_knex: knex) {
  const exists = await _knex.schema.hasTable('permission');
  if (!exists) {
    return _knex.schema.createTable('permission', table => {
      table.increments();
      table.string('name', 128).unique();
    });
  }
}

async function createRoleTable(_knex: knex) {
  const exists = await _knex.schema.hasTable('role');
  if (!exists) {
    return _knex.schema.createTable('role', table => {
      table.increments();
      table.string('name', 128).unique();
    });
  }
}

async function createRole_PermissionTable(_knex: knex) {
  const exists = await _knex.schema.hasTable('role_permission');
  if (!exists) {
    return _knex.schema.createTable('role_permission', table => {
      table.integer('roleId').unsigned();
      table.integer('permissionId').unsigned();
      // Constraints
      table
        .foreign('roleId')
        .references('role.id')
        .onDelete('CASCADE');
      table
        .foreign('permissionId')
        .references('permission.id')
        .onDelete('CASCADE');
      table.primary(['roleId', 'permissionId']);
    });
  }
}

async function createUser_RoleTable(_knex: knex) {
  const exists = await _knex.schema.hasTable('user_role');
  if (!exists) {
    return _knex.schema.createTable('user_role', table => {
      table.integer('userId').unsigned();
      table.integer('roleId').unsigned();
      // Constraints
      table
        .foreign('userId')
        .references('user.id')
        .onDelete('CASCADE');
      table
        .foreign('roleId')
        .references('role.id')
        .onDelete('CASCADE');
      table.primary(['userId', 'roleId']);
    });
  }
}

exports.up = (_knex: knex) => {
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

exports.down = (_knex: knex) => {
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
