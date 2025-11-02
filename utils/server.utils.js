import cors from '@fastify/cors';
import Fastify from 'fastify';

import { corsConfig } from '../configs/cors.config.js';
import { envConfig } from '../configs/env.config.js';
import { errorHandler } from '../handlers/error.handler.js';
import responsePlugin from '../plugins/response.plugin.js';
import { getLoggerConfig } from './logger.utils.js';

export async function buildApp() {
	const app = Fastify({
		logger: getLoggerConfig(),
	});

	// Register cors plugin
	app.register(cors, corsConfig);

	// Register response plugin
	app.register(responsePlugin);

	// Register all application routes
	await app.register(import('../routes/index.js'));

	// Set global error handler
	app.setErrorHandler(errorHandler);

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
