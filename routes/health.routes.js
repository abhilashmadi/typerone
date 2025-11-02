import healthHandler from '../handlers/health.handler.js';

/**
 * Health Check Routes
 * Used for monitoring and load balancer health checks
 */
export default async function healthRoutes(fastify, _options) {
	// Basic health check
	fastify.get('/health', healthHandler);
}
