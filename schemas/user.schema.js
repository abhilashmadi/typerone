import { z } from 'zod';

/**
 * User Profile Validation Schemas
 */

// Update profile schema
export const updateProfileSchema = z.object({
	username: z
		.string()
		.min(3, 'Username must be at least 3 characters')
		.max(20, 'Username must not exceed 20 characters')
		.regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
		.optional(),
	avatar: z.string().url('Invalid avatar URL').optional(),
	bio: z.string().max(500, 'Bio must not exceed 500 characters').optional(),
	preferences: z
		.object({
			theme: z.enum(['light', 'dark', 'system']).optional(),
			soundEnabled: z.boolean().optional(),
			language: z.string().optional(),
		})
		.optional(),
});

// Update settings schema
export const updateSettingsSchema = z.object({
	theme: z.enum(['light', 'dark', 'system']).optional(),
	soundEnabled: z.boolean().optional(),
	difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
	language: z.string().min(2).max(5).optional(),
	showKeyboard: z.boolean().optional(),
	blindMode: z.boolean().optional(),
	quickTab: z.boolean().optional(),
});

// Change password schema
export const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, 'Current password is required'),
	newPassword: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
		.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
		.regex(/[0-9]/, 'Password must contain at least one number'),
});

// Delete account schema
export const deleteAccountSchema = z.object({
	password: z.string().min(1, 'Password is required'),
	confirmation: z.literal('DELETE', {
		errorMap: () => ({ message: 'Please type DELETE to confirm' }),
	}),
});

// Get history query schema
export const getHistoryQuerySchema = z.object({
	page: z.string().regex(/^\d+$/).transform(Number).optional(),
	limit: z.string().regex(/^\d+$/).transform(Number).optional(),
	from: z.string().datetime().optional(),
	to: z.string().datetime().optional(),
});
