import z from 'zod';

const DEV_MODES = {
	PROD: 'production',
	DEV: 'development',
	TEST: 'testing',
};

const envSchema = z.object({
	// Server Configuration
	PORT: z.coerce.number().positive(),
	MODE: z.enum(Object.values(DEV_MODES)),

	// Database Configuration
	MONGO_URI: z.url().startsWith('mongodb').describe('MongoDB connection URI'),
});

export const envConfig = envSchema.parse(process.env);
