import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll } from 'vitest';

/**
 * (Override environment variables)
 * Set up environment variables for testing before any imports
 */
process.env.PORT = '3000';
process.env.MODE = 'testing';
process.env.MONGO_URI = 'mongodb://localhost:27017';
process.env.DB_NAME = 'test-db';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_ACCESS_TOKEN_EXPIRY = '15m';
process.env.JWT_REFRESH_TOKEN_EXPIRY = '7d';
process.env.COOKIE_SECRET = 'test-cookie-secret-for-testing-only';
process.env.COOKIE_DOMAIN = 'localhost';

let mongoServer;

/**
 * Connect to in-memory MongoDB instance before all tests
 */
beforeAll(async () => {
	// Create in-memory MongoDB instance
	mongoServer = await MongoMemoryServer.create();
	const mongoUri = mongoServer.getUri();

	// Connect mongoose to the in-memory database
	await mongoose.connect(mongoUri);
	console.log('✓ Connected to in-memory MongoDB for testing');
});

/**
 * Clean up database after each test to ensure test isolation
 */
afterEach(async () => {
	const collections = mongoose.connection.collections;

	for (const key in collections) {
		await collections[key].deleteMany({});
	}
});

/**
 * Close database connection and stop MongoDB server after all tests
 */
afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
	console.log('✓ Disconnected from in-memory MongoDB');
});
