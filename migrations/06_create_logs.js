exports.up = function (knex) {
  return knex.schema.createTable("logs", (table) => {
    table.string("event_id", 36).primary();  // UUID stored as string
    table.string("account_id", 36).notNullable();  // UUID stored as string
    table.string("destination_id", 36).notNullable();  // UUID stored as string
    table.timestamp("received_timestamp").notNullable();
    table.timestamp("processed_timestamp");  // Nullable since it might be processed later
    table.json("received_data").notNullable();
    table.string("status").notNullable().defaultTo("pending");  // pending, success, failed
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    
    // Foreign key constraints
    table.foreign("account_id").references("account_id").inTable("accounts").onDelete("CASCADE");
    table.foreign("destination_id").references("destination_id").inTable("destinations").onDelete("CASCADE");
    
    // Indexes for better query performance
    table.index(["account_id", "status"]);
    table.index(["destination_id", "status"]);
    table.index("received_timestamp");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("logs");
}; 