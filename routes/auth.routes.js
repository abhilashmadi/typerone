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
	fastify.post('/register', {
		schema: registerSchema,
		preHandler: validateRegistration,
		handler: registerHandler,
	});

	fastify.post('/login', {
		schema: loginSchema,
		handler: loginHandler,
	});

	fastify.post('/refresh', {
		handler: refreshHandler,
	});

	fastify.post('/logout', {
		preHandler: authenticate,
		handler: logoutHandler,
	});

	fastify.get('/me', {
		preHandler: authenticate,
		handler: meHandler,
	});
}
