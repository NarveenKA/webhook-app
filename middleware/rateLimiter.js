const rateLimit = require('express-rate-limit');
const Account = require('../models/account');

// Create a limiter for the /server/data route
const dataRouteLimiter = rateLimit({
    windowMs: 1000, // 1 second
    max: 5, // Limit each account to 5 requests per second
    message: {
        success: false,
        error: 'Rate limit exceeded. Maximum 5 requests per second per account allowed.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Using memory store by default
    // For production with multiple instances, use Redis or other distributed store
    
    // Custom key generator to use account token instead of IP
    keyGenerator: (req) => {
        const token = req.headers['cl-x-token'];
        if (!token) {
            return 'unauthorized';
        }
        return `account:${token}`;
    },

    // Skip rate limiting for requests without token (they'll be rejected by auth middleware anyway)
    skip: (req) => {
        return !req.headers['cl-x-token'];
    },

    // Handler for when rate limit is exceeded
    handler: (req, res) => {
        const resetTime = res.getHeader('RateLimit-Reset');
        const currentTime = Date.now();
        const msToReset = (resetTime * 1000) - currentTime;
        
        res.status(429).json({
            success: false,
            error: 'Rate limit exceeded. Maximum 5 requests per second per account allowed.',
            reset_in_ms: Math.max(0, msToReset),
            retry_after: Math.ceil(msToReset / 1000)
        });
    }
});

module.exports = {
    dataRouteLimiter
}; 