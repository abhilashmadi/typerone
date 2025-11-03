import pino from 'pino';
import { envConfig } from '../configs/env.config.js';

/**
 * Get Pino logger configuration for Fastify
 * @returns {Object|boolean} Pino logger configuration or false to disable
 */
export function getLoggerConfig() {
	// Disable logging completely in test environment
	if (envConfig.MODE === 'testing') {
		return false;
	}

	// Production: JSON logs, info level
	if (envConfig.MODE === 'production') {
		return {
			level: 'info',
		};
	}

	// Development: Pretty logs with colors
	return {
		level: 'debug',
		transport: {
			target: 'pino-pretty',
			options: {
				colorize: true,
				translateTime: 'HH:MM:ss Z',
				ignore: 'pid,hostname',
			},
		},
	};
}

/**
 * Centralized logger using Pino
 * This ensures consistent logging across the entire application
 * Note: Returns a silent logger in test mode
 */
export const logger = envConfig.MODE === 'testing' ? pino({ level: 'silent' }) : pino(getLoggerConfig());

/**
 * Create a child logger with a specific name/context
 * @param {string} name - The name/context for the logger
 * @returns {import('pino').Logger}
 */
export function createLogger(name) {
	return logger.child({ name });
}
