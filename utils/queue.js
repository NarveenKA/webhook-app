const Queue = require('bull');
const queueConfig = require('../config/queue');
const Log = require('../models/log');
const axios = require('axios');

// Helper function to validate and format headers
const formatHeaders = (headers) => {
    if (!headers) return {};
    
    // If headers is a string, try to parse it
    if (typeof headers === 'string') {
        try {
            headers = JSON.parse(headers);
        } catch (e) {
            console.warn('Failed to parse headers string:', e);
            return {};
        }
    }

    // Ensure headers is an object
    if (typeof headers !== 'object' || Array.isArray(headers)) {
        console.warn('Headers is not an object:', headers);
        return {};
    }

    // Format and validate headers
    const formattedHeaders = {};
    for (const [key, value] of Object.entries(headers)) {
        // Validate header name: only alphanumeric and -
        const validHeaderName = key.trim().replace(/[^a-zA-Z0-9-]/g, '-');
        
        // Validate header value: convert to string and remove invalid characters
        const validHeaderValue = String(value).replace(/[^\x20-\x7E]/g, '');
        
        formattedHeaders[validHeaderName] = validHeaderValue;
    }

    return formattedHeaders;
};

// Create webhook delivery queue
const webhookQueue = new Queue('webhook-delivery', {
    redis: queueConfig.redis,
    ...queueConfig.settings
});

// Process webhook delivery jobs
webhookQueue.process(async (job) => {
    const { event_id, destinationUrl, headers, payload } = job.data;
    
    try {
        // Verify log exists and get current status
        const log = await Log.findById(event_id);
        if (!log) {
            throw new Error(`Log not found for event_id: ${event_id}`);
        }

        // Update log status to processing
        await Log.updateStatus(event_id, Log.STATUS.PROCESSING);
        
        // Format and validate headers
        const formattedHeaders = formatHeaders(headers);
        
        // Add content-type if not present
        if (!formattedHeaders['content-type']) {
            formattedHeaders['content-type'] = 'application/json';
        }

        // Send webhook
        const response = await axios({
            method: 'POST',
            url: destinationUrl,
            headers: formattedHeaders,
            data: payload,
            timeout: 10000 // 10 seconds timeout
        });
        
        // Update log with success
        await Log.updateStatus(event_id, Log.STATUS.SUCCESS, new Date());
        
        return {
            status: 'success',
            statusCode: response.status,
            response: response.data
        };
    } catch (error) {
        console.error('Webhook delivery error details:', {
            event_id,
            destinationUrl,
            error: error.message,
            response: error.response?.data,
            stack: error.stack
        });

        // Update log with failure
        try {
            await Log.updateStatus(event_id, Log.STATUS.FAILED, new Date());
        } catch (updateError) {
            console.error('Failed to update log status:', {
                event_id,
                error: updateError.message
            });
        }
        
        // Throw error to trigger retry if attempts remain
        throw new Error(`Webhook delivery failed: ${error.message}`);
    }
});

// Handle completed jobs
webhookQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed with result:`, result);
});

// Handle failed jobs
webhookQueue.on('failed', (job, error) => {
    console.error(`Job ${job.id} failed with error:`, error);
});

// Handle job progress
webhookQueue.on('progress', (job, progress) => {
    console.log(`Job ${job.id} reported progress:`, progress);
});

// Add job to queue
const addToQueue = async (event_id, destinationUrl, headers, payload) => {
    return webhookQueue.add({
        event_id,
        destinationUrl,
        headers,
        payload
    }, {
        attempts: queueConfig.settings.attempts,
        backoff: queueConfig.settings.backoff
    });
};

module.exports = {
    addToQueue,
    webhookQueue
}; 