const { v4: uuidv4 } = require('uuid');
const Account = require('../models/account');
const Destination = require('../models/destination');
const Log = require('../models/log');
const { addToQueue } = require('../utils/queue');

// In-memory storage for temporary data (in production, use Redis or similar)
const tempDataStore = new Map();

/**
 * Receive initial data and generate event ID
 */
const receiveData = async (req, res) => {
  try {
        const clxToken = req.headers['cl-x-token'];
        
        if (!clxToken) {
            return res.status(401).json({
                success: false,
                error: 'Missing authentication token'
            });
        }

        // Validate that the request body is JSON
        if (!req.is('application/json')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid content type. Expected application/json'
            });
    }

        // Generate a unique event ID
        const eventId = uuidv4();

        // Store the received data temporarily
        tempDataStore.set(eventId, {
            data: req.body,
            token: clxToken,
            timestamp: new Date()
        });

        // Return the event ID to the client
        return res.status(200).json({
            success: true,
            data: {
                message: 'Data received successfully',
                event_id: eventId
            }
        });
    } catch (error) {
        console.error('Error in receiveData:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while processing data'
        });
    }
};

/**
 * Process data with event ID and queue for delivery
 */
const processData = async (req, res) => {
    try {
        const clxToken = req.headers['cl-x-token'];
        const eventId = req.headers['cl-x-event-id'];

        if (!clxToken || !eventId) {
            return res.status(401).json({
                success: false,
                error: 'Missing required headers'
            });
        }

        // Get the stored data
        const storedData = tempDataStore.get(eventId);
        if (!storedData) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        // Verify the token matches
        if (storedData.token !== clxToken) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token for this event'
            });
    }

        // Find the account associated with the token
        const account = await Account.findBySecretToken(clxToken);
    if (!account) {
            return res.status(401).json({
                success: false,
                error: 'Invalid account token'
            });
    }

        // Find destinations for this account
    const destinations = await Destination.findByAccountId(account.account_id);
    if (!destinations || destinations.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No destinations found for this account'
            });
    }

        // Create log entries and queue webhook deliveries for each destination
        const logPromises = destinations.map(async (destination) => {
            // Create unique event ID for each destination
            const destinationEventId = `${eventId}_${destination.destination_id}`;
            
            // Create log entry
            const [logId] = await Log.create({
                event_id: destinationEventId,
                account_id: account.account_id,
                destination_id: destination.destination_id,
                received_data: storedData.data,
                received_timestamp: storedData.timestamp,
                status: Log.STATUS.PENDING
            });

            // Queue webhook delivery
            await addToQueue(
                destinationEventId, // Use event_id instead of logId
                destination.url,
                destination.headers,
                storedData.data
            );

            return destinationEventId;
        });

        const eventIds = await Promise.all(logPromises);

        // Clean up the temporary storage
        tempDataStore.delete(eventId);

        return res.status(202).json({
            success: true,
            data: {
                message: 'Data queued for processing',
                event_ids: eventIds,
                account_id: account.account_id,
                destination_count: destinations.length
            }
    });
  } catch (error) {
        console.error('Error in processData:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while processing data'
        });
  }
};

module.exports = {
    receiveData,
    processData
};
