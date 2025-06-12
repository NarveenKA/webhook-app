const { webhookQueue } = require('../utils/queue');

console.log('Webhook worker started');

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Worker received SIGTERM signal');
    await webhookQueue.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('Worker received SIGINT signal');
    await webhookQueue.close();
    process.exit(0);
}); 