import * as knex from 'knex';

function createClientTable(_knex: knex) {
  return _knex.schema.createTableIfNotExists('client', (table: knex.CreateTableBuilder) => {
    table.increments();
    table.integer('projectId').unsigned();
    table.string('name', 128);
    table.string('clientId', 128);
    table.string('clientSecret', 128);
    table.timestamp('createdAt').defaultTo(_knex.fn.now());
    table.timestamp('modifiedAt').defaultTo(_knex.fn.now());
    // Constraints
    table.foreign('projectId').references('project.id').onDelete('CASCADE');
  });
}

exports.up = (_knex: knex) => {
  return createClientTable(_knex);
};

exports.down = (_knex: knex) => {
  const tables = [
    'client'
  ];
  return tables.reduce((promise, tableName) => {
    return promise.then(() => {
      return _knex.raw(`DROP TABLE "${tableName}" CASCADE`);
    });
  }, Promise.resolve());
};
