exports.up = function (knex) {
  return knex.schema.createTable("account_members", (table) => {
    table.increments("member_id").primary();
    table.uuid("account_id").notNullable();
    table.uuid("user_id").notNullable();
    table.integer("role_id").unsigned().notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.string("created_by").notNullable();
    table.string("updated_by").notNullable();
    
    // Foreign key constraints
    table.foreign("account_id").references("account_id").inTable("accounts").onDelete("CASCADE");
    table.foreign("user_id").references("user_id").inTable("users").onDelete("CASCADE");
    table.foreign("role_id").references("role_id").inTable("roles").onDelete("RESTRICT");
    
    // Unique constraint to prevent duplicate memberships
    table.unique(["account_id", "user_id"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("account_members");
}; 