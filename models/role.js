const db = require("../db/knex");

module.exports = {
  findAll() {
    return db("roles").select();
  },

  findById(role_id) {
    return db("roles").where({ role_id }).first();
  },

  findByName(role_name) {
    return db("roles").where({ role_name }).first();
  },

  // Constants for role IDs
  ROLES: {
    ADMIN: 1,
    NORMAL_USER: 2
  }
}; 