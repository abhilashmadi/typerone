import { forgotPasswordHandler } from '../handlers/auth-handlers/forgot-password.handler.js';
import { loginHandler } from '../handlers/auth-handlers/login.handler.js';
import { logoutHandler } from '../handlers/auth-handlers/logout.handler.js';
import { meHandler } from '../handlers/auth-handlers/me.handler.js';
import { refreshHandler } from '../handlers/auth-handlers/refresh.handler.js';
import { registerHandler } from '../handlers/auth-handlers/register.handler.js';
import { resetPasswordHandler } from '../handlers/auth-handlers/reset-password.handler.js';
import { validateRegistration, validateResetPassword } from '../lib/validators.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '../schemas/auth.schema.js';

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

	fastify.post('/forgot-password', {
		schema: forgotPasswordSchema,
		handler: forgotPasswordHandler,
	});

	fastify.post('/reset-password', {
		schema: resetPasswordSchema,
		preHandler: validateResetPassword,
		handler: resetPasswordHandler,
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
