import z from 'zod';

const DEV_MODES = {
	PROD: 'production',
	DEV: 'development',
	TEST: 'testing',
};

export const envSchema = z.object({
	// Server Configuration
	PORT: z.coerce.number().int().positive().describe('Port number on which the server runs'),

	MODE: z.enum(Object.values(DEV_MODES)),

	// Database Configuration
	MONGO_URI: z.url().startsWith('mongodb', { message: 'Must be a valid MongoDB URI' }).describe('Full MongoDB connection string'),

	DB_NAME: z.string().min(1, { message: 'Database name cannot be empty' }).describe('MongoDB database name'),

	// Authentication Configuration
	BETTER_AUTH_URL: z.url().describe('Base URL for the BetterAuth service'),

	BETTER_AUTH_SECRET: z.string().min(1, { message: 'BetterAuth secret is required' }).describe('Secret key for BetterAuth integration'),

	GITHUB_CLIENT_ID: z.string().min(1, { message: 'GitHub Client ID is required' }).describe('OAuth client ID for GitHub login'),

	GITHUB_CLIENT_SECRET: z.string().min(1, { message: 'GitHub Client Secret is required' }).describe('OAuth client secret for GitHub login'),
});

export const envConfig = envSchema.parse(process.env);
