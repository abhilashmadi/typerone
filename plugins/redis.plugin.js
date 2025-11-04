import { Redis } from '@upstash/redis';
import fp from 'fastify-plugin';
import { envConfig } from '../configs/env.config.js';

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

/**
 * Redis Fastify Plugin
 * Provides Redis client instance to the Fastify application
 * Makes redis available via fastify.redis and request.redis
 */
async function redisPlugin(fastify, options) {
	// Use provided client (for testing) or create new one
	const redisClient =
		options.client ||
		new Redis({
			url: envConfig.UPSTASH_REDIS_REST_URL,
			token: envConfig.UPSTASH_REDIS_REST_TOKEN,
			retry: {
				retries: 5,
				backoff: (retryCount) => Math.exp(retryCount) * 50,
			},
			readYourWrites: true,
			enableAutoPipelining: true,
		});

	// Decorate fastify instance with redis client
	fastify.decorate('redis', redisClient);

	// Add redis to request context for easier access in handlers
	fastify.decorateRequest('redis', { getter: () => fastify.redis });

	// Log when plugin is ready
	fastify.addHook('onReady', async () => {
		fastify.log.info('Redis plugin loaded and ready');
	});

	// Optional: Add cleanup on close
	fastify.addHook('onClose', async (instance) => {
		instance.log.info('Redis plugin cleanup on close');
		// Upstash Redis is HTTP-based, no persistent connection to close
	});
}

// Export as Fastify plugin with fastify-plugin wrapper
// This ensures the decorators are available at the parent scope
export default fp(redisPlugin, {
	name: 'redis-plugin',
	fastify: '5.x',
});
