import z from 'zod';

export const DEV_MODES = {
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

	// Redis Configuration
	UPSTASH_REDIS_REST_URL: z.url().describe('Upstash Redis REST URL'),
	UPSTASH_REDIS_REST_TOKEN: z.string().min(1, { message: 'Redis token cannot be empty' }).describe('Upstash Redis REST token'),

	// JWT Configuration
	JWT_SECRET: z.string().min(32, { message: 'JWT secret must be at least 32 characters' }).describe('Secret key for signing JWT tokens'),
	JWT_ACCESS_TOKEN_EXPIRY: z.string().describe('Access token expiry time (e.g., 15m, 1h)'),
	JWT_REFRESH_TOKEN_EXPIRY: z.string().describe('Refresh token expiry time (e.g., 7d, 30d)'),

	// Cookie Configuration
	COOKIE_SECRET: z.string().min(32, { message: 'Cookie secret must be at least 32 characters' }).describe('Secret key for signing cookies'),
	COOKIE_DOMAIN: z.string().describe('Cookie domain'),
});

export const envConfig = envSchema.parse(process.env);
