import { loginHandler } from '../handlers/auth-handlers/login.handler.js';
import { logoutHandler } from '../handlers/auth-handlers/logout.handler.js';
import { meHandler } from '../handlers/auth-handlers/me.handler.js';
import { refreshHandler } from '../handlers/auth-handlers/refresh.handler.js';
import { registerHandler } from '../handlers/auth-handlers/register.handler.js';
import { authenticate } from '../lib/auth.middleware.js';
import { validateRegistration } from '../lib/validators.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';

/**
 * Authentication routes
 * Uses Fastify's native JSON Schema validation
 * Validation errors are automatically handled by Fastify and caught by the global error handler
 */
export default async function authRoutes(fastify, _options) {
	// Register endpoint with schema validation and custom business logic validation
	fastify.post('/register', {
		schema: registerSchema,
		preHandler: validateRegistration,
		handler: registerHandler,
	});

	// Login endpoint with schema validation
	fastify.post('/login', {
		schema: loginSchema,
		handler: loginHandler,
	});

	// Refresh token endpoint
	fastify.post('/refresh', {
		handler: refreshHandler,
	});

	// Logout endpoint (requires authentication)
	fastify.post('/logout', {
		preHandler: authenticate,
		handler: logoutHandler,
	});

	// Get current user endpoint (requires authentication)
	fastify.get('/me', {
		preHandler: authenticate,
		handler: meHandler,
	});
}
