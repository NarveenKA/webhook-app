// /scripts/init_db.js

const knex = require('../db/knex');

async function init() {
  try {
    const hasAccounts = await knex.schema.hasTable('accounts');
    if (!hasAccounts) {
        await knex.schema.createTable('accounts', (table) => {
            table.increments('id').primary();
            table.string('account_id').unique().notNullable();  // Add this line
            table.string('email').notNullable().unique();
            table.string('account_name').notNullable();
            table.string('app_secret_token').notNullable();
            table.string('website').nullable();
            table.timestamps(true, true);
          });          
      console.log('✅ Accounts table created.');
    }

    const hasDestinations = await knex.schema.hasTable('destinations');
    if (!hasDestinations) {
      await knex.schema.createTable('destinations', (table) => {
        table.increments('id').primary();
        table.integer('account_id').unsigned().references('id').inTable('accounts').onDelete('CASCADE');
        table.string('url').notNullable();
        table.string('http_method').notNullable();
        table.json('headers').notNullable();
        table.timestamps(true, true);
      });
      console.log('✅ Destinations table created.');
    }

    console.log('✅ Database setup complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating tables:', err);
    process.exit(1);
  }
}

init();
