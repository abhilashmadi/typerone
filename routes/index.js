import fp from 'fastify-plugin';

/**
 * Main routes plugin - registers all application routes
 * This follows the Fastify best practice of using plugins for route organization
 */
async function routesPlugin(fastify, _options) {
	// Health check routes (no prefix, accessible at root)
	await fastify.register(import('./health.routes.js'));

	// API routes
	await fastify.register(import('./auth.routes.js'), {
		prefix: '/api/auth',
	});

	await fastify.register(import('./users.routes.js'), {
		prefix: '/api/users',
	});

	await fastify.register(import('./tests.routes.js'), {
		prefix: '/api/tests',
	});

	await fastify.register(import('./races.routes.js'), {
		prefix: '/api/races',
	});

	await fastify.register(import('./leaderboards.routes.js'), {
		prefix: '/api/leaderboards',
	});

	await fastify.register(import('./stats.routes.js'), {
		prefix: '/api/stats',
	});

	fastify.log.info('All routes registered successfully');
}

export default fp(routesPlugin, {
	name: 'routes-plugin',
	fastify: '5.x',
});
