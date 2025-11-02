/**
 * Health Check Routes
 * Used for monitoring and load balancer health checks
 */
export default async function healthRoutes(fastify, _options) {
	// Basic health check
	fastify.get('/health', async (_request, reply) => {
		return reply.success({
			status: 'ok',
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			environment: process.env.NODE_ENV || 'development',
		});
	});

	// Detailed readiness check (includes database connectivity)
	fastify.get('/ready', async (_request, reply) => {
		try {
			// Check database connection
			const dbState = fastify.mongoose.connection.readyState;
			const isDbConnected = dbState === 1; // 1 = connected

			if (!isDbConnected) {
				return reply.fail('Service not ready - database disconnected', 503);
			}

			return reply.success({
				status: 'ready',
				database: 'connected',
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			fastify.log.error({ error }, 'Readiness check failed');
			return reply.fail('Service not ready', 503);
		}
	});

	// Liveness check (simple ping)
	fastify.get('/ping', async (_request, _reply) => {
		return { pong: true };
	});
}
