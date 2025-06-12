const Log = require('../models/log');
const Destination = require('../models/destination');
const axios = require('axios');

class WebhookQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  async addToQueue(data) {
    this.queue.push(data);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.queue.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      await this.processWebhook(task);
    }

    this.isProcessing = false;
  }

  async processWebhook({ eventId, accountId, payload, destinations }) {
    for (const destination of destinations) {
      try {
        // Create log entry
        const logEntry = await Log.create({
          event_id: eventId,
          account_id: accountId,
          destination_id: destination.destination_id,
          received_data: payload,
          status: Log.STATUS.PENDING
        });

        // Send webhook
        const destHeaders = destination.headers || {};
        const destMethod = destination.http_method.toUpperCase();
        const destUrl = destination.url;

        let response;
        if (destMethod === 'GET') {
          response = await axios.get(destUrl, {
            params: payload,
            headers: destHeaders,
          });
        } else if (['POST', 'PUT'].includes(destMethod)) {
          response = await axios({
            method: destMethod.toLowerCase(),
            url: destUrl,
            data: payload,
            headers: destHeaders,
          });
        } else {
          throw new Error(`Unsupported HTTP method: ${destMethod}`);
        }

        // Update log with success
        await Log.updateStatus(eventId, Log.STATUS.SUCCESS);

      } catch (error) {
        // Update log with failure
        await Log.updateStatus(eventId, Log.STATUS.FAILED);
        console.error(`Error processing webhook for destination ${destination.destination_id}:`, error);
      }
    }
  }
}

// Create a singleton instance
const webhookQueue = new WebhookQueue();

module.exports = webhookQueue; 