import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import Fastify from 'fastify';

import { corsConfig } from '../configs/cors.config.js';
import { envConfig } from '../configs/env.config.js';
import { errorHandler } from '../handlers/error.handler.js';
import responsePlugin from '../plugins/response.plugin.js';
import routes from '../routes/index.js';
import { getLoggerConfig } from '../utils/logger.utils.js';

/**
 * Build and configure the Fastify application instance
 * @returns {Promise<FastifyInstance>}
 */
export async function buildApp() {
	const app = Fastify({
		logger: getLoggerConfig(),
		// Disable Fastify's default validation error response
		ajv: {
			customOptions: {
				allErrors: true,
			},
		},
	});

	// Register plugins
	await app.register(cors, corsConfig);
	await app.register(cookie, {
		secret: envConfig.COOKIE_SECRET,
		parseOptions: {},
	});
	await app.register(responsePlugin);

	// Set global error handler BEFORE registering routes
	app.setErrorHandler(errorHandler);

	// Register all application routes
	await app.register(routes);

	app.addHook('onReady', async () => {
		app.log.info('Application ready, all plugins loaded');
	});

	app.addHook('onListen', () => {
		app.log.info(`Server is now accepting connections on port ${envConfig.PORT}`);
	});

	app.addHook('onClose', async () => {
		app.log.info('Server is shutting down gracefully');
	});

	return app;
}

/**
 * Setup graceful shutdown handlers for the application
 * @param {FastifyInstance} app - The Fastify application instance
 */
export function setupGracefulShutdown(app) {
	const gracefulShutdown = async (signal) => {
		app.log.info(`${signal} received, starting graceful shutdown`);
		try {
			await app.close();
			app.log.info('Server closed successfully');
			process.exit(0);
		} catch (error) {
			app.log.error({ error }, 'Error during graceful shutdown');
			process.exit(1);
		}
	};

	process.on('SIGINT', () => gracefulShutdown('SIGINT'));
	process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}
