exports.up = function (knex) {
  return knex.schema.createTable("accounts", (table) => {
    table.uuid("account_id").primary();
    table.string("account_name").notNullable();
    table.string("app_secret_token").notNullable();
    table.string("website");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.string("created_by").notNullable();
    table.string("updated_by").notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("accounts");
};
