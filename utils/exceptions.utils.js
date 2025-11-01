import { StatusCodes } from './status-codes.utils.js';

/**
 * Base Application Exception
 */
export class AppException extends Error {
	constructor(message, statusCode = StatusCodes.INTERNAL_SERVER_ERROR, details = null) {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.details = details;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationException extends AppException {
	constructor(message = 'Validation failed', details = null) {
		super(message, StatusCodes.BAD_REQUEST, details);
	}
}

export class NotFoundException extends AppException {
	constructor(message = 'Resource not found') {
		super(message, StatusCodes.NOT_FOUND);
	}
}

export class UnauthorizedException extends AppException {
	constructor(message = 'Unauthorized') {
		super(message, StatusCodes.UNAUTHORIZED);
	}
}

export class ForbiddenException extends AppException {
	constructor(message = 'Forbidden') {
		super(message, StatusCodes.FORBIDDEN);
	}
}

export class ConflictException extends AppException {
	constructor(message = 'Resource conflict') {
		super(message, StatusCodes.CONFLICT);
	}
}

export class BadRequestException extends AppException {
	constructor(message = 'Bad request', details = null) {
		super(message, StatusCodes.BAD_REQUEST, details);
	}
}
