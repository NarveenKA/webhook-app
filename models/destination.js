const db = require("../db/knex");

module.exports = {
  create(destination) {
    return db("destinations").insert(destination);
  },
  findAll() {
    return db("destinations").select();
  },
  findByAccountId(account_id) {
    return db("destinations").where({ account_id });
  },
  findById(destination_id) {
    return db("destinations").where({ destination_id }).first();
  },
  update(destination_id, updates) {
    return db("destinations").where({ destination_id }).update(updates);
  },
  delete(destination_id) {
    return db("destinations").where({ destination_id }).del();
  },
  deleteByAccountId(account_id) {
    return db("destinations").where({ account_id }).del();
  },
  validateHeaders(headers) {
    if (!headers || typeof headers !== "object" || Array.isArray(headers)) {
      return false;
    }
    
    // Check if headers are empty
    if (Object.keys(headers).length === 0) {
      return false;
    }

    // Validate each header key and value
    for (const [key, value] of Object.entries(headers)) {
      if (typeof key !== "string" || key.trim().length === 0) {
        return false;
      }
      if (typeof value !== "string") {
        return false;
      }
    }

    return true;
  },
};

