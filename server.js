import { envConfig } from './configs/env.config.js';
import { connectDatabase } from './configs/mongoose.config.js';
import { buildApp, setupGracefulShutdown } from './lib/app.js';

async function start(app) {
	try {
		await connectDatabase();

		await app.listen({
			port: envConfig.PORT,
			host: '0.0.0.0',
		});

		app.log.info(`Successfully started in ${envConfig.MODE} mode`);
	} catch (error) {
		app.log.error({ error }, 'Failed to start server');
		process.exit(1);
	}
}

const app = await buildApp();
setupGracefulShutdown(app);
start(app);
