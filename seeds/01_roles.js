exports.seed = async function(knex) {
  // First, delete existing entries
  await knex('roles').del();
  
  // Then insert the default roles
  await knex('roles').insert([
    {
      role_id: 1,
      role_name: 'Admin',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      role_id: 2,
      role_name: 'Normal User',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);
}; 