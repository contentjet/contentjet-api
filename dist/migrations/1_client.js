"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createClientTable(knex) {
    return knex.schema.createTableIfNotExists('client', function (table) {
        table.increments();
        table.integer('projectId').unsigned();
        table.string('name', 128);
        table.string('clientId', 128);
        table.string('clientSecret', 128);
        table.timestamp('createdAt').defaultTo(knex.fn.now());
        table.timestamp('modifiedAt').defaultTo(knex.fn.now());
        // Constraints
        table.foreign('projectId').references('project.id').onDelete('CASCADE');
    });
}
exports.up = function (knex) {
    return createClientTable(knex);
};
exports.down = function (knex) {
    const tables = [
        'client'
    ];
    return tables.reduce((promise, tableName) => {
        return promise.then(() => {
            return knex.raw(`DROP TABLE "${tableName}" CASCADE`);
        });
    }, Promise.resolve());
};
