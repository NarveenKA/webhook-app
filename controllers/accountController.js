// /controllers/accountController.js

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const Account = require('../models/account');
const Destination = require('../models/destination');

module.exports = {
  async create(req, res) {
    const { email, account_name, website } = req.body;
    if (!email || !account_name) {
      return res.status(400).json({ message: 'Email and Account Name are required' });
    }

    try {
      const existing = await Account.findByEmail(email);
      if (existing) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const account = {
        account_id: uuidv4(),
        email,
        account_name,
        website: website || null,
        app_secret_token: crypto.randomBytes(32).toString('hex')
      };

      await Account.create(account);
      res.status(201).json(account);
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  },

  async getAll(req, res) {
    try {
      const accounts = await Account.findAll();
      res.json(accounts);
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const account = await Account.findById(req.params.id);
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }
      res.json(account);
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  },

  async update(req, res) {
    try {
      const updated = await Account.update(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Account not found' });
      }
      res.json({ message: 'Account updated successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  },

  async delete(req, res) {
    try {
      const deleted = await Account.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Account not found' });
      }
      await Destination.deleteByAccountId(req.params.id);
      res.json({ message: 'Account and associated destinations deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  }
};
