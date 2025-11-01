import pino from 'pino';
import { envConfig } from '../configs/env.config.js';

/**
 * Get Pino logger configuration
 * This ensures consistent logging across the entire application
 */
export function getLoggerConfig() {
	return {
		level: envConfig.MODE === 'production' ? 'info' : 'debug',
		transport:
			envConfig.MODE !== 'production'
				? {
						target: 'pino-pretty',
						options: {
							colorize: true,
							translateTime: 'HH:MM:ss Z',
							ignore: 'pid,hostname',
						},
					}
				: undefined,
	};
}

/**
 * Centralized logger using Pino (same logger Fastify uses)
 * This ensures consistent logging across the entire application
 */
export const logger = pino(getLoggerConfig());

/**
 * Create a child logger with a specific name/context
 * @param {string} name - The name/context for the logger
 * @returns {import('pino').Logger}
 */
export function createLogger(name) {
	return logger.child({ name });
}
