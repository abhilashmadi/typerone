import fp from 'fastify-plugin';
import { StatusCodes } from '../utils/status-codes.utils.js';

async function responsePlugin(fastify, _options) {
	/**
	 * Success response
	 * @param {*} data - Response data
	 * @param {number} [statusCode=200] - HTTP status code
	 */
	fastify.decorateReply('success', function (data, statusCode = StatusCodes.OK) {
		return this.code(statusCode).send({
			success: true,
			data,
		});
	});

	/**
	 * Fail response (client error)
	 * @param {string} message - Error message
	 * @param {number} [statusCode=400] - HTTP status code
	 * @param {*} [details=null] - Additional details (e.g., validation errors)
	 */
	fastify.decorateReply('fail', function (message, statusCode = StatusCodes.BAD_REQUEST, details = null) {
		const response = {
			success: false,
			message,
		};

		if (details) {
			response.details = details;
		}

		return this.code(statusCode).send(response);
	});

	/**
	 * Error response (server error)
	 * @param {string} message - Error message
	 * @param {number} [statusCode=500] - HTTP status code
	 * @param {string} [stack=null] - Stack trace (only in development)
	 */
	fastify.decorateReply('error', function (message, statusCode = StatusCodes.INTERNAL_SERVER_ERROR, stack = null) {
		const response = {
			success: false,
			message,
		};

		if (stack) {
			response.error = stack;
		}

		return this.code(statusCode).send(response);
	});
}

export default fp(responsePlugin, {
	name: 'response-plugin',
	fastify: '5.x',
});
