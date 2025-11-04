/**
 * Test Setup - Database and Redis Initialization
 *
 * Note: Environment variables are set in setup-env.js which runs before this file.
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { getMockRedis, resetMockRedis } from './helpers/redis-mock.js';

let mongoServer;
let redis;

/**
 * Connect to in-memory MongoDB instance and set up mock Redis before all tests
 */
beforeAll(async () => {
	// Set up mock Redis client
	redis = getMockRedis();
	console.log('✓ Mock Redis client initialized for testing');

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

	// Clean up Redis data after each test
	if (redis) {
		await redis.flushall();
	}
});

/**
 * Close database connection and stop MongoDB server after all tests
 */
afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
	console.log('✓ Disconnected from in-memory MongoDB');

	// Clean up Redis
	resetMockRedis();
	console.log('✓ Mock Redis client cleaned up');
});

// Export redis instance for tests that need direct access
export { redis };
