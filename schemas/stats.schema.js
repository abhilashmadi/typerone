import { z } from 'zod';

/**
 * Statistics Validation Schemas
 */

// Period query schema (used in multiple stats endpoints)
export const periodQuerySchema = z.object({
	period: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
});

// WPM stats query schema
export const getWpmStatsQuerySchema = z.object({
	period: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
});

// Accuracy stats query schema
export const getAccuracyStatsQuerySchema = z.object({
	period: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
});

// Progress query schema
export const getProgressQuerySchema = z.object({
	metric: z.enum(['wpm', 'accuracy', 'races', 'tests']).default('wpm'),
	period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
});

// Compare query schema
export const getCompareQuerySchema = z.object({
	userId: z.string().optional(),
});

// Export query schema
export const getExportQuerySchema = z.object({
	format: z.enum(['json', 'csv']).default('json'),
});
