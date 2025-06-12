const knex = require('knex');
const config = require('../knexfile');
const path = require('path');
const fs = require('fs').promises;

async function initializeDatabase() {
  const db = knex(config.development);

  try {
    // Get all migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = await fs.readdir(migrationsDir);
    
    console.log('Starting database initialization...');

    // Drop all tables if they exist (in reverse order to handle foreign keys)
    console.log('Dropping existing tables...');
    await db.schema.dropTableIfExists('logs');
    await db.schema.dropTableIfExists('account_members');
    await db.schema.dropTableIfExists('roles');
    await db.schema.dropTableIfExists('destinations');
    await db.schema.dropTableIfExists('accounts');
    await db.schema.dropTableIfExists('users');
    await db.schema.dropTableIfExists('knex_migrations');
    await db.schema.dropTableIfExists('knex_migrations_lock');

    // Run migrations
    console.log('Running migrations...');
    await db.migrate.latest();

    console.log('Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase(); 