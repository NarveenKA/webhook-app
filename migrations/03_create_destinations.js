exports.up = function (knex) {
  return knex.schema.createTable("destinations", (table) => {
    table.uuid("destination_id").primary();
    table
      .uuid("account_id")
      .notNullable()
      .references("account_id")
      .inTable("accounts")
      .onDelete("CASCADE");
    table.string("url").notNullable();
    table.string("http_method").notNullable();
    table.json("headers").notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.string("created_by").notNullable();
    table.string("updated_by").notNullable();

    // Add unique constraint for account_id + url + http_method combination
    table.unique(['account_id', 'url', 'http_method'], 'unique_destination_per_account');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("destinations");
};
