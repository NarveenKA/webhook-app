// /controllers/destinationController.js

const Destination = require('../models/destination');

module.exports = {
  async create(req, res) {
    const { account_id, url, http_method, headers } = req.body;
    if (!account_id || !url || !http_method || !headers) {
      return res.status(400).json({ message: 'All fields are required: account_id, url, http_method, headers' });
    }

    try {
      const destination = {
        account_id,
        url,
        http_method: http_method.toUpperCase(),
        headers: JSON.stringify(headers)
      };

      await Destination.create(destination);
      res.status(201).json({ message: 'Destination created successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  },

  async getByAccountId(req, res) {
    try {
      const destinations = await Destination.findByAccountId(req.params.account_id);
      res.json(destinations);
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const destination = await Destination.findById(req.params.id);
      if (!destination) {
        return res.status(404).json({ message: 'Destination not found' });
      }
      res.json(destination);
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  },

  async update(req, res) {
    try {
      const updates = req.body;
      if (updates.headers) {
        updates.headers = JSON.stringify(updates.headers);
      }

      const updated = await Destination.update(req.params.id, updates);
      if (!updated) {
        return res.status(404).json({ message: 'Destination not found' });
      }
      res.json({ message: 'Destination updated successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  },

  async delete(req, res) {
    try {
      const deleted = await Destination.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Destination not found' });
      }
      res.json({ message: 'Destination deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  }
};
