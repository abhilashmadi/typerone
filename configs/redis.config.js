import { Redis } from '@upstash/redis';
import { envConfig } from './env.config.js';

/**
 * Redis client instance using Upstash Redis
 * Configured with automatic retries and consistency guarantees
 */
let redisClient = null;

/**
 * Get or create Redis client instance (singleton pattern)
 * @returns {Redis} Redis client instance
 */
export function getRedisClient() {
	if (!redisClient) {
		redisClient = new Redis({
			url: envConfig.UPSTASH_REDIS_REST_URL,
			token: envConfig.UPSTASH_REDIS_REST_TOKEN,
			retry: {
				retries: 5,
				backoff: (retryCount) => Math.exp(retryCount) * 50,
			},
			readYourWrites: true,
			enableAutoPipelining: true,
		});
	}
	return redisClient;
}

/**
 * Set the Redis client (used for testing to inject mock)
 * @param {Redis} client - Redis client instance
 */
export function setRedisClient(client) {
	redisClient = client;
}

/**
 * Reset the Redis client (used for testing)
 */
export function resetRedisClient() {
	redisClient = null;
}

/**
 * Redis key prefixes for different data types
 */
export const REDIS_KEYS = {
	PASSWORD_RESET: (token) => `password_reset:${token}`,
	PASSWORD_RESET_BY_EMAIL: (email) => `password_reset_email:${email}`,
};

/**
 * Redis TTL constants (in seconds)
 */
export const REDIS_TTL = {
	PASSWORD_RESET: 300, // 5 minutes
};
