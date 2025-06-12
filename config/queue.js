module.exports = {
    // Redis connection options
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        username: process.env.REDIS_USERNAME || '',
        password: process.env.REDIS_PASSWORD || '',
    },
    
    // Queue settings
    settings: {
        // Maximum number of jobs processed concurrently per worker
        concurrency: 10,
        
        // Maximum number of job attempts on failure
        attempts: 3,
        
        // Backoff strategy for failed jobs
        backoff: {
            type: 'exponential',
            delay: 1000 // Initial delay in ms
        },
        
        // Remove completed jobs to save memory
        removeOnComplete: true,
        
        // Keep failed jobs for debugging
        removeOnFail: false
    }
}; 