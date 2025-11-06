import { StatusCodes } from '../utils/status-codes.utils.js';
import { envConfig } from './env.config.js';

export const corsConfig = {
	origin: envConfig.COOKIE_DOMAIN,
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
