/**
 * HTTP Status Codes and Messages
 */

export const StatusCodes = {
	// 2xx Success
	OK: 200,
	CREATED: 201,
	NO_CONTENT: 204,

	// 4xx Client Errors
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	UNPROCESSABLE_ENTITY: 422,
	TOO_MANY_REQUESTS: 429,

	// 5xx Server Errors
	INTERNAL_SERVER_ERROR: 500,
	SERVICE_UNAVAILABLE: 503,
};

export const StatusMessages = {
	[StatusCodes.OK]: 'OK',
	[StatusCodes.CREATED]: 'Created',
	[StatusCodes.NO_CONTENT]: 'No Content',
	[StatusCodes.BAD_REQUEST]: 'Bad Request',
	[StatusCodes.UNAUTHORIZED]: 'Unauthorized',
	[StatusCodes.FORBIDDEN]: 'Forbidden',
	[StatusCodes.NOT_FOUND]: 'Not Found',
	[StatusCodes.CONFLICT]: 'Conflict',
	[StatusCodes.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
	[StatusCodes.TOO_MANY_REQUESTS]: 'Too Many Requests',
	[StatusCodes.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
	[StatusCodes.SERVICE_UNAVAILABLE]: 'Service Unavailable',
};
