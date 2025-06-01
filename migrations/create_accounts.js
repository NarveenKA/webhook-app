exports.up = function(knex) {
    return knex.schema.createTable('accounts', (table) => {
      table.uuid('account_id').primary();
      table.string('email').unique().notNullable();
      table.string('account_name').notNullable();
      table.string('app_secret_token').notNullable();
      table.string('website');
      table.timestamps(true, true);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('accounts');
  };
  