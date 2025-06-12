const db = require("../db/knex");
const bcrypt = require("bcrypt");

module.exports = {
  async create(user) {
    try {
      // Check if email already exists
      const existingUser = await this.findByEmail(user.email);
      if (existingUser) {
        throw new Error('Email already exists');
      }

      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const userData = {
        ...user,
        password: hashedPassword,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return db("users").insert(userData);
    } catch (error) {
      if (error.message === 'Email already exists') {
        throw error;
      }
      // Handle database unique constraint violation
      if (error.code === '23505' || error.message.includes('unique constraint')) {
        throw new Error('Email already exists');
      }
      throw error;
    }
  },

  async findByEmail(email) {
    return db("users").where({ email }).first();
  },

  async findById(user_id) {
    return db("users").where({ user_id }).first();
  },

  async update(user_id, updates) {
    try {
      // If email is being updated, check if it already exists
      if (updates.email) {
        const existingUser = await this.findByEmail(updates.email);
        if (existingUser && existingUser.user_id !== user_id) {
          throw new Error('Email already exists');
        }
      }

      // If password is being updated, hash it
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }

      // Add updated timestamp
      updates.updated_at = new Date().toISOString();

      return db("users").where({ user_id }).update(updates);
    } catch (error) {
      if (error.message === 'Email already exists') {
        throw error;
      }
      // Handle database unique constraint violation
      if (error.code === '23505' || error.message.includes('unique constraint')) {
        throw new Error('Email already exists');
      }
      throw error;
    }
  },

  async delete(user_id) {
    return db("users").where({ user_id }).del();
  },

  async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password);
  },

  async count() {
    const result = await db("users").count('user_id as count').first();
    return parseInt(result.count);
  },

  async findAll() {
    return db("users")
      .select('user_id', 'email', 'role_id', 'created_at', 'updated_at')
      .orderBy('created_at', 'desc');
  }
};
