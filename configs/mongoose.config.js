import mongoose from 'mongoose';
import { createLogger } from '../utils/logger.utils.js';
import { envConfig } from './env.config.js';

const logger = createLogger('MongoDB');

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
			dbName: envConfig.DB_NAME,
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
			logger.info(`Connected successfully to ${mongoose.connection.name}`);
		});

		// Error event
		mongoose.connection.on('error', (error) => {
			logger.error({ error }, 'Connection error');
		});

		// Disconnected event
		mongoose.connection.on('disconnected', () => {
			this.isConnected = false;
			logger.warn('Disconnected from database');
		});

		// Reconnected event
		mongoose.connection.on('reconnected', () => {
			this.isConnected = true;
			logger.info('Reconnected to database');
		});

		// Reconnect failed event
		mongoose.connection.on('reconnectFailed', () => {
			this.isConnected = false;
			logger.error('Reconnection attempts failed');
		});

		// Process termination handlers
		const gracefulShutdown = async (signal) => {
			logger.info(`${signal} received. Closing database connection...`);

			try {
				await this.disconnect();
				logger.info('Database connection closed successfully');
				process.exit(0);
			} catch (error) {
				logger.error({ error }, 'Error during graceful shutdown');
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
			logger.info('Already connected');
			return mongoose;
		}

		// Return existing connection promise if connection is in progress
		if (this.connectionPromise) {
			logger.info('Connection in progress, waiting...');
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
				logger.info(`Attempting to connect... (Attempt ${retries + 1}/${maxRetries})`);
				await mongoose.connect(envConfig.MONGO_URI, this.options);

				// Set mongoose configuration
				mongoose.set('strictQuery', true); // Strict mode for queries
				mongoose.set('strict', 'throw'); // Throw errors for unknown fields

				this.isConnected = true;
				logger.info('Database connected and configured successfully');
				return mongoose;
			} catch (error) {
				retries++;
				logger.error({ error: error.message }, `Connection attempt ${retries} failed`);

				if (retries >= maxRetries) {
					logger.error('Maximum retry attempts reached. Unable to connect to database.');
					throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts: ${error.message}`);
				}

				logger.info(`Retrying in ${retryDelay / 1000} seconds...`);
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
			logger.info('Already disconnected');
			return;
		}

		try {
			await mongoose.disconnect();
			this.isConnected = false;
			logger.info('Disconnected successfully');
		} catch (error) {
			logger.error({ error }, 'Error during disconnection');
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
