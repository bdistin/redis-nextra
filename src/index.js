const redis = require('redis');
const { promisify } = require('util');

for (const [key, method] of Object.entries(redis.RedisClient.prototype)) {
	if (typeof method === 'function') redis.RedisClient.prototype[key] = promisify(method);
}

for (const [key, method] of Object.entries(redis.Multi.prototype)) {
	if (typeof method === 'function') redis.Multi.prototype[key] = promisify(method);
}

module.exports = redis;