import { z } from 'zod';

/**
 * Multiplayer Race Validation Schemas
 */

// Create race schema
export const createRaceSchema = z.object({
	mode: z.enum(['public', 'private', 'friends']).default('public'),
	maxPlayers: z.number().int().min(2, 'Minimum 2 players').max(10, 'Maximum 10 players').default(5),
	difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
	duration: z.number().int().positive('Duration must be positive').default(60),
	password: z.string().optional(), // For private races
});

// Ready status schema
export const readyStatusSchema = z.object({
	ready: z.boolean().default(true),
});

// Finish race schema
export const finishRaceSchema = z.object({
	userInput: z.string().min(1, 'User input is required'),
	timeCompleted: z.number().positive('Time must be positive'),
});

// Get lobby query schema
export const getLobbyQuerySchema = z.object({
	difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
	mode: z.enum(['public', 'private', 'friends']).default('public'),
});

// Quick match schema
export const quickMatchSchema = z.object({
	difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
	skillLevel: z.number().int().min(1).max(100).optional(), // For skill-based matchmaking
});

// Get race history query schema
export const getRaceHistoryQuerySchema = z.object({
	page: z.string().regex(/^\d+$/).transform(Number).default('1'),
	limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
});

// Join private race schema
export const joinPrivateRaceSchema = z.object({
	password: z.string().optional(),
});
