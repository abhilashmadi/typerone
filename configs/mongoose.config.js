import mongoose from 'mongoose';
import { envConfig } from './env.config.js';

// So here's the deal: we're using a singleton pattern to manage our MongoDB connection.
// Why? Because we don't want multiple connections floating around - that's just asking for trouble.
// This class handles all the connection lifecycle stuff, retry logic, and event handling for us.
class MongooseConnection {
	static instance = null;

	constructor() {
		this.isConnected = false;
		this.connectionPromise = null;
		this.handlersSetup = false;
	}

	/**
	 * Get singleton instance
	 * @returns {MongooseConnection}
	 */
	static getInstance() {
		if (!MongooseConnection.instance) {
			MongooseConnection.instance = new MongooseConnection();
		}
		return MongooseConnection.instance;
	}

	/**
	 * Mongoose connection options
	 * Optimized for latest Mongoose (v8.x)
	 */
	get options() {
		return {
			autoIndex: envConfig.MODE !== 'production', // Disable in production for better performance
			autoCreate: true,
			maxPoolSize: 10,
			minPoolSize: 2,
			socketTimeoutMS: 45000,
			serverSelectionTimeoutMS: 30000,
		};
	}

	/**
	 * Setup connection event handlers
	 * @private
	 */
	setupConnectionHandlers() {
		// Only setup once to avoid duplicate listeners
		if (this.handlersSetup) return;

		// Connected event
		mongoose.connection.on('connected', () => {
			this.isConnected = true;
			console.info(`[MongoDB] Connected successfully to ${mongoose.connection.name}`);
		});

		// Error event
		mongoose.connection.on('error', (error) => {
			console.error('[MongoDB] Connection error:', error);
		});

		// Disconnected event
		mongoose.connection.on('disconnected', () => {
			this.isConnected = false;
			console.warn('[MongoDB] Disconnected from database');
		});

		// Reconnected event
		mongoose.connection.on('reconnected', () => {
			this.isConnected = true;
			console.log('[MongoDB] Reconnected to database');
		});

		// Reconnect failed event
		mongoose.connection.on('reconnectFailed', () => {
			this.isConnected = false;
			console.error('[MongoDB] Reconnection attempts failed');
		});

		// Process termination handlers
		const gracefulShutdown = async (signal) => {
			console.log(`\n[MongoDB] ${signal} received. Closing database connection...`);

			try {
				await this.disconnect();
				console.log('[MongoDB] Database connection closed successfully');
				process.exit(0);
			} catch (error) {
				console.error('[MongoDB] Error during graceful shutdown:', error);
				process.exit(1);
			}
		};

		process.on('SIGINT', () => gracefulShutdown('SIGINT'));
		process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

		this.handlersSetup = true;
	}

	/**
	 * Connect to MongoDB with retry logic
	 * @param {number} maxRetries - Maximum number of connection retry attempts
	 * @param {number} retryDelay - Delay between retries in milliseconds
	 * @returns {Promise<typeof mongoose>}
	 */
	async connect(maxRetries = 5, retryDelay = 5000) {
		// Return existing connection if already connected
		if (this.isConnected && mongoose.connection.readyState === 1) {
			console.log('[MongoDB] Already connected');
			return mongoose;
		}

		// Return existing connection promise if connection is in progress
		if (this.connectionPromise) {
			console.log('[MongoDB] Connection in progress, waiting...');
			return this.connectionPromise;
		}

		// Setup connection event handlers
		this.setupConnectionHandlers();

		// Create new connection promise
		this.connectionPromise = this.attemptConnection(maxRetries, retryDelay);

		try {
			const result = await this.connectionPromise;
			return result;
		} finally {
			this.connectionPromise = null;
		}
	}

	/**
	 * Attempt connection with retry logic
	 * @private
	 */
	async attemptConnection(maxRetries, retryDelay) {
		let retries = 0;

		while (retries < maxRetries) {
			try {
				console.log(`[MongoDB] Attempting to connect... (Attempt ${retries + 1}/${maxRetries})`);
				await mongoose.connect(envConfig.MONGO_URI, this.options);

				// Set mongoose configuration
				mongoose.set('strictQuery', true); // Strict mode for queries
				mongoose.set('strict', 'throw'); // Throw errors for unknown fields

				this.isConnected = true;
				console.log('[MongoDB] Database connected and configured successfully');
				return mongoose;
			} catch (error) {
				retries++;
				console.error(`[MongoDB] Connection attempt ${retries} failed:`, error.message);

				if (retries >= maxRetries) {
					console.error('[MongoDB] Maximum retry attempts reached. Unable to connect to database.');
					throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts: ${error.message}`);
				}

				console.log(`[MongoDB] Retrying in ${retryDelay / 1000} seconds...`);
				await new Promise((resolve) => setTimeout(resolve, retryDelay));
			}
		}
	}

	/**
	 * Disconnect from MongoDB
	 * @returns {Promise<void>}
	 */
	async disconnect() {
		if (!this.isConnected) {
			console.log('[MongoDB] Already disconnected');
			return;
		}

		try {
			await mongoose.disconnect();
			this.isConnected = false;
			console.log('[MongoDB] Disconnected successfully');
		} catch (error) {
			console.error('[MongoDB] Error during disconnection:', error);
			throw error;
		}
	}

	/**
	 * Check database connection status
	 * @returns {boolean}
	 */
	getConnectionStatus() {
		return this.isConnected && mongoose.connection.readyState === 1;
	}

	/**
	 * Get database connection state
	 * @returns {string}
	 */
	getConnectionState() {
		const states = {
			0: 'disconnected',
			1: 'connected',
			2: 'connecting',
			3: 'disconnecting',
			99: 'uninitialized',
		};
		return states[mongoose.connection.readyState] || 'unknown';
	}

	/**
	 * Get mongoose instance
	 * @returns {typeof mongoose}
	 */
	getMongoose() {
		return mongoose;
	}
}

// Get singleton instance
const mongooseConnection = MongooseConnection.getInstance();

// Export convenience methods (bound to singleton instance)
export const connectDatabase = mongooseConnection.connect.bind(mongooseConnection);
export const disconnectDatabase = mongooseConnection.disconnect.bind(mongooseConnection);
export const isDatabaseConnected = mongooseConnection.getConnectionStatus.bind(mongooseConnection);
export const getDatabaseState = mongooseConnection.getConnectionState.bind(mongooseConnection);
export const getMongoose = mongooseConnection.getMongoose.bind(mongooseConnection);

// Export the singleton instance as default
export default mongooseConnection;

// Export mongoose for convenience
export { mongoose };
