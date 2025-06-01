const db = require('../db/knex');

module.exports = {
  create(account) {
    return db('accounts').insert(account);
  },
  findByEmail(email) {
    return db('accounts').where({ email }).first();
  },
  findByToken(token) {
    return db('accounts').where({ app_secret_token: token }).first();
  },
  findAll() {
    return db('accounts').select();
  },
  findById(account_id) {
    return db('accounts').where({ account_id }).first();
  },
  update(account_id, updates) {
    return db('accounts').where({ account_id }).update(updates);
  },
  delete(account_id) {
    return db('accounts').where({ account_id }).del();
  }
};
