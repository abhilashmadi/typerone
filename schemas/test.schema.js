import { z } from 'zod';

/**
 * Typing Test Validation Schemas
 */

// Get new test query schema
export const getNewTestQuerySchema = z.object({
	mode: z.enum(['time', 'words', 'custom']).default('time'),
	difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
	language: z.string().min(2).max(5).default('en'),
	duration: z.string().regex(/^\d+$/).transform(Number).default('60'),
});

// Submit test result schema
export const submitTestSchema = z.object({
	testId: z.string().min(1, 'Test ID is required'),
	text: z.string().min(1, 'Test text is required'),
	userInput: z.string().min(1, 'User input is required'),
	duration: z.number().positive('Duration must be positive').int(),
	mode: z.enum(['time', 'words', 'custom']),
});

// Get texts query schema
export const getTextsQuerySchema = z.object({
	difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
	language: z.string().min(2).max(5).optional(),
	category: z.string().optional(),
});

// Daily challenge date query schema
export const getDailyChallengeQuerySchema = z.object({
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
});

// Submit daily challenge schema
export const submitDailyChallengeSchema = z.object({
	challengeId: z.string().min(1, 'Challenge ID is required'),
	userInput: z.string().min(1, 'User input is required'),
	duration: z.number().positive('Duration must be positive').int(),
});

// Analyze text schema
export const analyzeTextSchema = z.object({
	text: z.string().min(10, 'Text must be at least 10 characters').max(5000, 'Text must not exceed 5000 characters'),
});
