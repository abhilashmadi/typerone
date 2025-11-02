import { z } from 'zod';

/**
 * Authentication Validation Schemas
 * Using Zod for runtime type validation
 */

// Register schema
export const registerSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
		.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
		.regex(/[0-9]/, 'Password must contain at least one number'),
	username: z
		.string()
		.min(3, 'Username must be at least 3 characters')
		.max(20, 'Username must not exceed 20 characters')
		.regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
});

// Login schema
export const loginSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(1, 'Password is required'),
});

// Refresh token schema
export const refreshTokenSchema = z.object({
	refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Email verification schema
export const verifyEmailSchema = z.object({
	token: z.string().min(1, 'Verification token is required'),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
	email: z.string().email('Invalid email address'),
});

// Reset password schema
export const resetPasswordSchema = z.object({
	token: z.string().min(1, 'Reset token is required'),
	newPassword: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
		.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
		.regex(/[0-9]/, 'Password must contain at least one number'),
});
