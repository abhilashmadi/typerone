/**
 * Environment Variable Setup for Testing
 *
 * IMPORTANT: This file MUST NOT import any application code.
 * It only sets environment variables and must run before any other setup files.
 * This ensures env vars are set before any config files try to parse them.
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
process.env.UPSTASH_REDIS_REST_URL = 'http://redis-client.url';
process.env.UPSTASH_REDIS_REST_TOKEN = 'upstash-redis-rest-token';
process.env.GITHUB_PAT = 'github-pat-key';
