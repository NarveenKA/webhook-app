exports.up = function (knex) {
  return knex.schema
    .createTable("roles", (table) => {
      table.increments("role_id").primary();
      table.string("role_name").notNullable().unique();
      table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
      table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    })
    .then(() => {
      // Seed the default roles
      return knex("roles").insert([
        {
          role_name: "Admin",
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        },
        {
          role_name: "Normal User",
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }
      ]);
    });
};

exports.down = function (knex) {
  return knex.schema.dropTable("roles");
}; 