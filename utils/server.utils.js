import Fastify from 'fastify';
import { errorHandler } from 'nodefling';
import { fastifyConfig } from '../configs/fastify.config.js';

export function buildApp() {
	const app = Fastify(fastifyConfig);

	app.setErrorHandler(errorHandler);

	app.addHook('onReady', async () => {
		app.log.info('[Server] Application ready, all plugins loaded');
	});

	app.addHook('onListen', () => {
		app.log.info(`[Server] Server is now accepting connections on port ${envConfig.PORT}`);
	});

	app.addHook('onClose', async () => {
		app.log.info('[Server] Server is shutting down gracefully');
	});

	app.get('/health', async () => ({
		status: 'ok',
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		environment: envConfig.MODE,
	}));

	return app;
}

export function setupGracefulShutdown(app) {
	const gracefulShutdown = async (signal) => {
		app.log.info(`[Server] ${signal} received, starting graceful shutdown`);
		try {
			await app.close();
			app.log.info('[Server] Server closed successfully');
			process.exit(0);
		} catch (error) {
			app.log.error(error, '[Server] Error during graceful shutdown');
			process.exit(1);
		}
	};

	process.on('SIGINT', () => gracefulShutdown('SIGINT'));
	process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}
