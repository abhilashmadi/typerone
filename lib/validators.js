import { BadRequestException } from '../utils/exceptions.utils.js';

/**
 * Validation utilities for complex business logic that cannot be expressed in JSON Schema
 * These validators are used as preHandlers in routes
 */

/**
 * Validates password complexity requirements
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * @param {string} password - Password to validate
 * @throws {BadRequestException} If password doesn't meet requirements
 */
function validatePasswordComplexity(password) {
	const hasUpperCase = /[A-Z]/.test(password);
	const hasLowerCase = /[a-z]/.test(password);
	const hasNumber = /[0-9]/.test(password);
	const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>[\]\\/'`~_=;+|-]/.test(password);

	const errors = [];

	if (!hasUpperCase) {
		errors.push('Password must contain at least one uppercase letter');
	}
	if (!hasLowerCase) {
		errors.push('Password must contain at least one lowercase letter');
	}
	if (!hasNumber) {
		errors.push('Password must contain at least one number');
	}
	if (!hasSpecialChar) {
		errors.push('Password must contain at least one special character');
	}

	if (errors.length > 0) {
		throw new BadRequestException('Password validation failed', { password: errors });
	}
}

/**
 * Validates that password and confirmPassword match
 * @param {string} password - Password
 * @param {string} confirmPassword - Password confirmation
 * @throws {BadRequestException} If passwords don't match
 */
function validatePasswordMatch(password, confirmPassword) {
	if (password !== confirmPassword) {
		throw new BadRequestException('Validation failed', {
			confirmPassword: ["Passwords don't match"],
		});
	}
}

/**
 * Fastify preHandler hook for registration validation
 * Validates password complexity and password match
 */
export async function validateRegistration(request, _reply) {
	const { password, confirmPassword } = request.body;

	// Validate password complexity
	validatePasswordComplexity(password);

	// Validate password match
	validatePasswordMatch(password, confirmPassword);
}
