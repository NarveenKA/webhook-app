exports.up = function (knex) {
  return knex.schema.createTable("users", (table) => {
    table.uuid("user_id").primary();
    table.string("email").unique().notNullable();
    table.string("password").notNullable();
    table.integer("role_id").unsigned().notNullable().defaultTo(1); // Default to Admin (role_id: 1)
    table.foreign("role_id").references("role_id").inTable("roles").onDelete("RESTRICT");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("users");
};
