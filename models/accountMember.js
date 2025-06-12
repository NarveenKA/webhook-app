const db = require("../db/knex");

module.exports = {
  create(member) {
    member.created_at = db.fn.now();
    member.updated_at = db.fn.now();
    return db("account_members").insert(member);
  },

  findAll() {
    return db("account_members")
      .select(
        "account_members.*",
        "users.email as user_email",
        "accounts.account_name as account_name"
      )
      .leftJoin("users", "account_members.user_id", "users.user_id")
      .leftJoin("accounts", "account_members.account_id", "accounts.account_id");
  },

  findById(member_id) {
    return db("account_members")
      .where({ member_id })
      .first();
  },

  findByAccountId(account_id) {
    return db("account_members")
      .where({ account_id })
      .select(
        "account_members.*",
        "users.email as user_email"
      )
      .leftJoin("users", "account_members.user_id", "users.user_id");
  },

  findByUserId(user_id) {
    return db("account_members")
      .where({ user_id })
      .select(
        "account_members.*",
        "accounts.account_name as account_name"
      )
      .leftJoin("accounts", "account_members.account_id", "accounts.account_id");
  },

  findByAccountAndUser(account_id, user_id) {
    return db("account_members")
      .where({ account_id, user_id })
      .first();
  },

  update(member_id, updates, updated_by) {
    updates.updated_at = db.fn.now();
    updates.updated_by = updated_by;
    return db("account_members")
      .where({ member_id })
      .update(updates);
  },

  delete(member_id) {
    return db("account_members")
      .where({ member_id })
      .del();
  },

  deleteByAccountAndUser(account_id, user_id) {
    return db("account_members")
      .where({ account_id, user_id })
      .del();
  }
}; 