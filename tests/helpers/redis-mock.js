/**
 * Mock Redis client for testing
 * Implements a simple in-memory key-value store that mimics Redis behavior
 */

class RedisMock {
	constructor() {
		this.store = new Map();
		this.ttls = new Map();
	}

	async set(key, value, options = {}) {
		this.store.set(key, value);
		if (options.ex) {
			// Set TTL in milliseconds
			this.ttls.set(key, Date.now() + options.ex * 1000);
		}
		return 'OK';
	}

	async get(key) {
		// Check if key has expired
		if (this.ttls.has(key)) {
			if (Date.now() > this.ttls.get(key)) {
				this.store.delete(key);
				this.ttls.delete(key);
				return null;
			}
		}
		return this.store.get(key) || null;
	}

	async del(...keys) {
		let deletedCount = 0;
		for (const key of keys) {
			if (this.store.has(key)) {
				this.store.delete(key);
				this.ttls.delete(key);
				deletedCount++;
			}
		}
		return deletedCount;
	}

	async keys(pattern) {
		// Simple pattern matching for wildcard (*)
		if (pattern.includes('*')) {
			const regexPattern = pattern.replace(/\*/g, '.*');
			const regex = new RegExp(`^${regexPattern}$`);
			return Array.from(this.store.keys()).filter((key) => regex.test(key));
		}
		return this.store.has(pattern) ? [pattern] : [];
	}

	async exists(...keys) {
		let count = 0;
		for (const key of keys) {
			if (this.store.has(key)) {
				count++;
			}
		}
		return count;
	}

	async ttl(key) {
		if (!this.ttls.has(key)) {
			return -1; // No expiration
		}
		const expiresAt = this.ttls.get(key);
		const ttl = Math.floor((expiresAt - Date.now()) / 1000);
		return ttl > 0 ? ttl : -2; // -2 means expired
	}

	async flushall() {
		this.store.clear();
		this.ttls.clear();
		return 'OK';
	}

	// Clean up expired keys (manually trigger expiration check)
	_cleanupExpired() {
		const now = Date.now();
		for (const [key, expiresAt] of this.ttls.entries()) {
			if (now > expiresAt) {
				this.store.delete(key);
				this.ttls.delete(key);
			}
		}
	}
}

// Singleton instance
let mockRedis = null;

export function getMockRedis() {
	if (!mockRedis) {
		mockRedis = new RedisMock();
	}
	return mockRedis;
}

export function resetMockRedis() {
	if (mockRedis) {
		mockRedis.flushall();
	}
	mockRedis = null;
}
