const db = require('../db/knex');

module.exports = {
  create(destination) {
    return db('destinations').insert(destination);
  },
  findAll() {
    return db('destinations').select();
  },
  findByAccountId(account_id) {
    return db('destinations').where({ account_id });
  },
  findById(id) {
    return db('destinations').where({ id }).first();
  },
  update(id, updates) {
    return db('destinations').where({ id }).update(updates);
  },
  delete(id) {
    return db('destinations').where({ id }).del();
  },
  deleteByAccountId(account_id) {
    return db('destinations').where({ account_id }).del();
  }
};
