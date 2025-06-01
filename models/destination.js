// /models/destination.js

const db = require('../db/knex');

module.exports = {
  // Create a new destination for an account
  create(destination) {
    return db('destinations').insert(destination);
  },

  // Get all destinations (optional)
  findAll() {
    return db('destinations').select();
  },

  // Get all destinations for a specific account
  findByAccountId(account_id) {
    return db('destinations').where({ account_id });
  },

  // Get a specific destination by its ID
  findById(id) {
    return db('destinations').where({ id }).first();
  },

  // Update a destination by ID
  update(id, updates) {
    return db('destinations').where({ id }).update(updates);
  },

  // Delete a destination by ID
  delete(id) {
    return db('destinations').where({ id }).del();
  },

  // Delete all destinations for a specific account (used when account is deleted)
  deleteByAccountId(account_id) {
    return db('destinations').where({ account_id }).del();
  }
};
