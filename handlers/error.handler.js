import { envConfig } from '../configs/env.config.js';
import { AppException } from '../utils/exceptions.utils.js';
import { StatusCodes } from '../utils/status-codes.utils.js';

/**
 * Global Error Handler
 * Catches all exceptions and formats them using the response plugin
 */
export async function errorHandler(error, request, reply) {
	// Log the error
	request.log.error(
		{
			err: error,
			url: request.url,
			method: request.method,
			requestId: request.id,
		},
		'Error occurred',
	);

	const isDevelopment = envConfig.MODE !== 'production';
	const stack = isDevelopment ? error.stack : null;

	// Handle custom AppException
	if (error instanceof AppException) {
		const statusCode = error.statusCode;

		// Client errors (4xx) - use fail()
		if (statusCode >= StatusCodes.BAD_REQUEST && statusCode < StatusCodes.INTERNAL_SERVER_ERROR) {
			return reply.fail(error.message, statusCode, error.details);
		}

		// Server errors (5xx) - use error()
		return reply.error(error.message, statusCode, stack);
	}

	// Handle Zod validation errors
	if (error.name === 'ZodError' && error.issues) {
		const details = formatZodErrors(error.issues);
		return reply.fail('Validation failed', StatusCodes.BAD_REQUEST, details);
	}

	// Handle Fastify validation errors
	if (error.validation || error.code === 'FST_ERR_VALIDATION') {
		const details = error.validation ? formatValidationErrors(error.validation) : null;
		return reply.fail('Validation failed', StatusCodes.BAD_REQUEST, details);
	}

	// Handle MongoDB duplicate key error
	if (error.code === 11000) {
		const field = Object.keys(error.keyPattern || {})[0] || 'field';
		return reply.fail(`Duplicate ${field}`, StatusCodes.CONFLICT);
	}

	// Handle Mongoose validation error
	if (error.name === 'ValidationError' && error.errors) {
		const details = formatMongooseErrors(error.errors);
		return reply.fail('Validation failed', StatusCodes.BAD_REQUEST, details);
	}

	// Handle Mongoose cast error (invalid ObjectId)
	if (error.name === 'CastError') {
		return reply.fail(`Invalid ${error.path}`, StatusCodes.BAD_REQUEST);
	}

	// Handle JWT errors
	if (error.name === 'JsonWebTokenError') {
		return reply.fail('Invalid token', StatusCodes.UNAUTHORIZED);
	}

	if (error.name === 'TokenExpiredError') {
		return reply.fail('Token expired', StatusCodes.UNAUTHORIZED);
	}

	// Handle known Fastify errors with statusCode
	if (error.statusCode) {
		// Client errors (4xx)
		if (error.statusCode >= 400 && error.statusCode < 500) {
			return reply.fail(error.message || 'Bad request', error.statusCode);
		}

		// Server errors (5xx)
		return reply.error(error.message || 'Server error', error.statusCode, stack);
	}

	// Default: Internal server error
	const message = isDevelopment ? error.message : 'Internal server error';
	return reply.error(message, StatusCodes.INTERNAL_SERVER_ERROR, stack);
}

// Format Fastify validation errors
function formatValidationErrors(validationErrors) {
	const errors = {};

	for (const error of validationErrors) {
		const field = error.instancePath ? error.instancePath.replace(/^\//, '').replace(/\//g, '.') : error.params?.missingProperty || 'unknown';

		if (!errors[field]) {
			errors[field] = [];
		}

		errors[field].push(error.message);
	}

	return errors;
}

function formatZodErrors(issues) {
	const errors = {};

	for (const issue of issues) {
		const field = issue.path.join('.') || 'unknown';

		if (!errors[field]) {
			errors[field] = [];
		}

		errors[field].push(issue.message);
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
