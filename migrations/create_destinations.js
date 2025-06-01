exports.up = function(knex) {
    return knex.schema.createTable('destinations', (table) => {
      table.increments('id').primary();
      table.uuid('account_id').notNullable().references('account_id').inTable('accounts').onDelete('CASCADE');
      table.string('url').notNullable();
      table.string('http_method').notNullable();
      table.json('headers').notNullable();
      table.timestamps(true, true);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('destinations');
  };
  