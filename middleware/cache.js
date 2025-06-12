const redisClient = require('../utils/redis');
const { CACHE_KEYS, CACHE_TTL } = require('../config/redis');

const cacheMiddleware = (type) => async (req, res, next) => {
  // Skip caching for non-GET requests
  if (req.method !== 'GET') {
    return next();
  }

  try {
    // Generate cache key based on request parameters
    const cacheKey = generateCacheKey(type, req);
    
    // Try to get data from cache
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    // Store original send function
    const originalSend = res.json;

    // Override send function to cache the response
    res.json = function (data) {
      // Cache the response data
      redisClient.set(cacheKey, data, CACHE_TTL[type]);
      
      // Call original send function
      return originalSend.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Cache Middleware Error:', error);
    next();
  }
};

const generateCacheKey = (type, req) => {
  let key = CACHE_KEYS[type];
  
  // Add query parameters to cache key
  if (Object.keys(req.query).length > 0) {
    const queryString = new URLSearchParams(req.query).toString();
    key += `:${queryString}`;
  }
  
  // Add URL parameters to cache key
  if (Object.keys(req.params).length > 0) {
    key += `:${Object.values(req.params).join(':')}`;
  }
  
  return key;
};

const clearCache = (type) => async (req, res, next) => {
  try {
    const cacheKey = CACHE_KEYS[type];
    await redisClient.del(cacheKey);
    next();
  } catch (error) {
    console.error('Clear Cache Error:', error);
    next();
  }
};

module.exports = {
  cacheMiddleware,
  clearCache
}; 