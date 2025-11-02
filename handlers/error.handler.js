import { envConfig } from '../configs/env.config.js';
import { AppException } from '../utils/exceptions.utils.js';
import { StatusCodes } from '../utils/status-codes.utils.js';

export async function errorHandler(error, request, reply) {
	// Log all errors for monitoring
	request.log.error(
		{
			err: error,
			url: request.url,
			method: request.method,
			requestId: request.id,
		},
		'Error occurred',
	);

	const isDevelopment = envConfig.MODE === 'development';
	const stack = isDevelopment ? error.stack : null;

	// 1. Handle Fastify validation errors (JSON Schema) - Must check before statusCode
	if (error.validation || error.code === 'FST_ERR_VALIDATION') {
		const details = formatFastifyValidationErrors(error.validation, error.validationContext);
		return reply.fail('Validation failed', StatusCodes.BAD_REQUEST, details);
	}

	// 2. Handle custom AppException
	if (error instanceof AppException) {
		const statusCode = error.statusCode;
		const isClientError = statusCode >= 400 && statusCode < 500;

		return isClientError ? reply.fail(error.message, statusCode, error.details) : reply.error(error.message, statusCode, stack);
	}

	// 3. Handle JWT errors
	if (error.name === 'JsonWebTokenError') {
		return reply.fail('Invalid token', StatusCodes.UNAUTHORIZED);
	}
	if (error.name === 'TokenExpiredError') {
		return reply.fail('Token expired', StatusCodes.UNAUTHORIZED);
	}

	// 4. Handle MongoDB errors
	if (error.code === 11000) {
		const field = Object.keys(error.keyPattern || {})[0] || 'field';
		return reply.fail(`${field} already exists`, StatusCodes.CONFLICT);
	}

	// 5. Handle Mongoose validation errors
	if (error.name === 'ValidationError' && error.errors) {
		const details = formatMongooseErrors(error.errors);
		return reply.fail('Validation failed', StatusCodes.BAD_REQUEST, details);
	}

	// 6. Handle Mongoose cast errors (invalid ObjectId, etc.)
	if (error.name === 'CastError') {
		return reply.fail(`Invalid ${error.path}`, StatusCodes.BAD_REQUEST);
	}

	// 7. Handle generic Fastify errors with statusCode
	if (error.statusCode) {
		const isClientError = error.statusCode >= 400 && error.statusCode < 500;

		const message = error.message || (isClientError ? 'Bad request' : 'Server error');
		return isClientError ? reply.fail(message, error.statusCode) : reply.error(message, error.statusCode, stack);
	}

	// 8. Default: Internal server error
	const message = isDevelopment ? error.message : 'Internal server error';
	return reply.error(message, StatusCodes.INTERNAL_SERVER_ERROR, stack);
}

function formatFastifyValidationErrors(validationErrors, context) {
	const errors = {};

	for (const err of validationErrors) {
		// Determine field name from error
		const field = err.instancePath?.replace(/^\//, '').replace(/\//g, '.') || err.params?.missingProperty || context || 'request';

		// Initialize array if needed
		if (!errors[field]) {
			errors[field] = [];
		}

		// Add error message
		errors[field].push(err.message || 'Invalid value');
	}

	return errors;
}

function formatMongooseErrors(validationErrors) {
	const errors = {};
	for (const [field, error] of Object.entries(validationErrors)) {
		errors[field] = [error.message];
	}
	return errors;
}
