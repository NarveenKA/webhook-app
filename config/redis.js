const CACHE_KEYS = {
  ACCOUNT: 'account',
};

const CACHE_TTL = {
  ACCOUNT: 3600, // 1 hour in seconds
};

const getRedisConfig = () => {
  const config = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    retryStrategy: (times) => {
      if (times > 3) {
        console.error('Redis connection failed');
        return null;
      }
      return Math.min(times * 100, 3000);
    },
  };

  // Add username and password if provided
  if (process.env.REDIS_USERNAME) {
    config.username = process.env.REDIS_USERNAME;
  }
  if (process.env.REDIS_PASSWORD) {
    config.password = process.env.REDIS_PASSWORD;
  }

  return config;
};

module.exports = {
  REDIS_CONFIG: getRedisConfig(),
  CACHE_KEYS,
  CACHE_TTL,
}; 