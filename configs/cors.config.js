import { StatusCodes } from '../utils/status-codes.utils.js';
import { DEV_MODES, envConfig } from './env.config.js';

/**
 * CORS Configuration for Fastify
 * @see https://github.com/fastify/fastify-cors
 */

/**
 * Get allowed origins based on environment
 */
function getAllowedOrigins() {
	if (envConfig.MODE === DEV_MODES.DEV || envConfig.MODE === DEV_MODES.TEST) {
		// Allow common development origins
		return ['http://localhost:3000'];
	}

	return [envConfig.BETTER_AUTH_URL];
}

export const corsConfig = {
	origin: getAllowedOrigins(),
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
	exposedHeaders: ['Content-Length', 'X-Request-Id'],
	maxAge: 86400,

	// Allow preflight to succeed even for 404s
	preflightContinue: false,

	// Provide successful status for OPTIONS requests
	optionsSuccessStatus: StatusCodes.NO_CONTENT,
};
