import { z } from 'zod';

/**
 * Leaderboard Validation Schemas
 */

// Global leaderboard query schema
export const getGlobalLeaderboardQuerySchema = z.object({
	period: z.enum(['all', 'year', 'month', 'week', 'day']).default('all'),
	metric: z.enum(['highest_wpm', 'average_wpm', 'total_races', 'accuracy']).default('highest_wpm'),
	page: z.string().regex(/^\d+$/).transform(Number).default('1'),
	limit: z.string().regex(/^\d+$/).transform(Number).default('50'),
});

// Daily leaderboard query schema
export const getDailyLeaderboardQuerySchema = z.object({
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	limit: z.string().regex(/^\d+$/).transform(Number).default('100'),
});

// Weekly leaderboard query schema
export const getWeeklyLeaderboardQuerySchema = z.object({
	limit: z.string().regex(/^\d+$/).transform(Number).default('100'),
});

// Difficulty leaderboard query schema
export const getDifficultyLeaderboardQuerySchema = z.object({
	period: z.enum(['all', 'month', 'week']).default('all'),
	page: z.string().regex(/^\d+$/).transform(Number).default('1'),
	limit: z.string().regex(/^\d+$/).transform(Number).default('50'),
});

// Language leaderboard query schema
export const getLanguageLeaderboardQuerySchema = z.object({
	page: z.string().regex(/^\d+$/).transform(Number).default('1'),
	limit: z.string().regex(/^\d+$/).transform(Number).default('50'),
});

// Nearby ranks query schema
export const getNearbyRanksQuerySchema = z.object({
	range: z.string().regex(/^\d+$/).transform(Number).default('5'),
});
