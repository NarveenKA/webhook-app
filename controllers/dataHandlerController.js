// /controllers/dataHandlerController.js

const Account = require('../models/account');
const Destination = require('../models/destination');
const axios = require('axios');
const qs = require('qs');

module.exports = {
  async receiveData(req, res) {
    const token = req.headers['cl-x-token'];

    if (!token) {
      return res.status(401).json({ message: 'Un Authenticate' });
    }

    try {
      const account = await Account.findByToken(token);
      if (!account) {
        return res.status(401).json({ message: 'Invalid Token' });
      }

      const data = req.body;

      if (!data || typeof data !== 'object') {
        return res.status(400).json({ message: 'Invalid Data' });
      }

      const destinations = await Destination.findByAccountId(account.account_id);

      for (const dest of destinations) {
        const headers = JSON.parse(dest.headers);
        const url = dest.url;
        const method = dest.http_method.toLowerCase();

        try {
          if (method === 'get') {
            await axios.get(url, {
              headers,
              params: data,
              paramsSerializer: params => qs.stringify(params)
            });
          } else if (method === 'post' || method === 'put') {
            await axios({
              method,
              url,
              headers,
              data
            });
          }
        } catch (err) {
          console.error(`Error sending data to ${url}:`, err.message);
        }
      }

      res.json({ message: 'Data forwarded to destinations' });
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  }
};
