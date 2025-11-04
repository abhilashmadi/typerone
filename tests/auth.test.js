import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { REDIS_KEYS, resetRedisClient, setRedisClient } from '../configs/redis.config.js';
import { buildApp } from '../lib/app.js';
import { generateResetToken } from '../lib/jwt.utils.js';
import { StatusCodes } from '../utils/status-codes.utils.js';
import { getMockRedis } from './helpers/redis-mock.js';
import {
	createAuthenticatedUser,
	extractCookies,
	formatCookieHeader,
	generateTestEmail,
	generateTestPassword,
	generateTestUsername,
} from './helpers/test-helpers.js';

/**
 * Comprehensive Authentication Integration Tests
 *
 * This test suite covers complete user flows and scenarios rather than testing
 * individual endpoints in isolation. Tests are organized by user journeys and
 * include validation, error handling, and edge cases within realistic contexts.
 */
describe('Authentication Flow Integration', () => {
	let app;
	let server;
	let redis;

	beforeAll(async () => {
		// Inject mock Redis client for testing
		redis = getMockRedis();
		setRedisClient(redis);

		app = await buildApp();
		await app.ready();
		await app.listen({ port: 0 });
		server = app.server;
	});

	afterAll(async () => {
		await app.close();
		// Reset Redis client after tests
		resetRedisClient();
	});

	// ========================================
	// Happy Path: Complete User Journeys
	// ========================================

	it('should complete full authentication lifecycle', async () => {
		const username = generateTestUsername();
		const email = generateTestEmail(username);
		const password = generateTestPassword();

		// 1. Register
		const registerResponse = await request(server)
			.post('/api/auth/register')
			.send({ username, email, password, confirmPassword: password })
			.expect(StatusCodes.CREATED);

		let cookies = extractCookies(registerResponse);
		expect(cookies).toHaveProperty('accessToken');

		// 2. Access protected route
		await request(server).get('/api/auth/me').set('Cookie', formatCookieHeader(cookies)).expect(StatusCodes.OK);

		// 3. Refresh token
		const refreshResponse = await request(server)
			.post('/api/auth/refresh')
			.set('Cookie', `refreshToken=${cookies.refreshToken}`)
			.expect(StatusCodes.OK);

		const refreshedCookies = extractCookies(refreshResponse);
		cookies = { ...cookies, accessToken: refreshedCookies.accessToken };

		// 4. Access protected route with new token
		await request(server).get('/api/auth/me').set('Cookie', formatCookieHeader(cookies)).expect(StatusCodes.OK);

		// 5. Logout
		await request(server).post('/api/auth/logout').set('Cookie', formatCookieHeader(cookies)).expect(StatusCodes.OK);

		// 6. Verify cannot access protected route after logout
		await request(server).get('/api/auth/me').set('Cookie', formatCookieHeader(cookies)).expect(StatusCodes.UNAUTHORIZED);

		// 7. Login again
		const loginResponse = await request(server).post('/api/auth/login').send({ username, password }).expect(StatusCodes.OK);

		const newCookies = extractCookies(loginResponse);

		// 8. Access protected route with new login
		await request(server).get('/api/auth/me').set('Cookie', formatCookieHeader(newCookies)).expect(StatusCodes.OK);
	});

	it('should handle concurrent requests from same user', async () => {
		const { cookies } = await createAuthenticatedUser(request(server));

		// Make multiple concurrent requests
		const requests = Array(5)
			.fill(null)
			.map(() => request(server).get('/api/auth/me').set('Cookie', formatCookieHeader(cookies)));

		const responses = await Promise.all(requests);

		// All should succeed
		for (const response of responses) {
			expect(response.status).toBe(StatusCodes.OK);
			expect(response.body).toHaveProperty('success', true);
		}
	});

	it('should maintain session isolation between users', async () => {
		// Create two users
		const user1 = await createAuthenticatedUser(request(server));
		const user2 = await createAuthenticatedUser(request(server));

		// Each user should only see their own data
		const response1 = await request(server).get('/api/auth/me').set('Cookie', formatCookieHeader(user1.cookies)).expect(StatusCodes.OK);

		const response2 = await request(server).get('/api/auth/me').set('Cookie', formatCookieHeader(user2.cookies)).expect(StatusCodes.OK);

		expect(response1.body.data.user.username).toBe(user1.username);
		expect(response2.body.data.user.username).toBe(user2.username);
		expect(response1.body.data.user.id).not.toBe(response2.body.data.user.id);
	});

	it('should complete full password reset flow', async () => {
		// 1. Register user and get their info
		const { user, username, email, password } = await createAuthenticatedUser(request(server));

		// 2. Login with original password
		await request(server).post('/api/auth/login').send({ username, password }).expect(StatusCodes.OK);

		// 3. Request password reset
		const forgotResponse = await request(server).post('/api/auth/forgot-password').send({ identifier: email }).expect(StatusCodes.OK);

		expect(forgotResponse.body).toHaveProperty('success', true);

		// 4. Simulate getting reset token from email (we'll create one manually for testing)
		const { token, hashedToken } = generateResetToken();
		await redis.set(REDIS_KEYS.PASSWORD_RESET(hashedToken), user.id.toString(), { ex: 300 });

		// 5. Reset password with token
		const newPassword = 'NewSecurePassword456!@#';
		const resetResponse = await request(server)
			.post('/api/auth/reset-password')
			.send({ token, password: newPassword, confirmPassword: newPassword })
			.expect(StatusCodes.OK);

		expect(resetResponse.body).toHaveProperty('success', true);

		// 6. Verify old password no longer works
		await request(server).post('/api/auth/login').send({ username, password }).expect(StatusCodes.UNAUTHORIZED);

		// 7. Verify new password works
		const loginResponse = await request(server).post('/api/auth/login').send({ username, password: newPassword }).expect(StatusCodes.OK);

		expect(loginResponse.body).toHaveProperty('success', true);

		// 8. Verify can access protected routes with new credentials
		const cookies = extractCookies(loginResponse);
		const meResponse = await request(server).get('/api/auth/me').set('Cookie', formatCookieHeader(cookies)).expect(StatusCodes.OK);

		expect(meResponse.body.data.user.username).toBe(username);
	});

	it('should handle password reset and concurrent login attempts', async () => {
		const { user, username, cookies: activeCookies } = await createAuthenticatedUser(request(server));

		// User requests password reset (maybe forgot they were logged in)
		await request(server).post('/api/auth/forgot-password').send({ identifier: username }).expect(StatusCodes.OK);

		// Create reset token
		const { token, hashedToken } = generateResetToken();
		await redis.set(REDIS_KEYS.PASSWORD_RESET(hashedToken), user.id.toString(), { ex: 300 });

		// User can still use active session while reset token is pending
		await request(server).get('/api/auth/me').set('Cookie', formatCookieHeader(activeCookies)).expect(StatusCodes.OK);

		// User completes password reset
		const newPassword = 'NewPassword789!@#';
		await request(server)
			.post('/api/auth/reset-password')
			.send({ token, password: newPassword, confirmPassword: newPassword })
			.expect(StatusCodes.OK);

		// Old session should still work (sessions aren't invalidated on password change)
		await request(server).get('/api/auth/me').set('Cookie', formatCookieHeader(activeCookies)).expect(StatusCodes.OK);

		// New login with new password should work
		const newLoginResponse = await request(server).post('/api/auth/login').send({ username, password: newPassword }).expect(StatusCodes.OK);

		expect(newLoginResponse.body).toHaveProperty('success', true);
	});

	it('should handle complete user journey with multiple password changes', async () => {
		// 1. Register user
		const { user, username, password: originalPassword } = await createAuthenticatedUser(request(server));

		// 2. First password reset
		let { token, hashedToken } = generateResetToken();
		await redis.set(REDIS_KEYS.PASSWORD_RESET(hashedToken), user.id.toString(), { ex: 300 });

		const firstNewPassword = 'FirstNewPassword123!@#';
		await request(server)
			.post('/api/auth/reset-password')
			.send({ token, password: firstNewPassword, confirmPassword: firstNewPassword })
			.expect(StatusCodes.OK);

		// 3. Login with first new password
		await request(server).post('/api/auth/login').send({ username, password: firstNewPassword }).expect(StatusCodes.OK);

		// 4. Second password reset
		({ token, hashedToken } = generateResetToken());
		await redis.set(REDIS_KEYS.PASSWORD_RESET(hashedToken), user.id.toString(), { ex: 300 });

		const secondNewPassword = 'SecondNewPassword456!@#';
		await request(server)
			.post('/api/auth/reset-password')
			.send({ token, password: secondNewPassword, confirmPassword: secondNewPassword })
			.expect(StatusCodes.OK);

		// 5. Verify can only login with latest password
		await request(server).post('/api/auth/login').send({ username, password: originalPassword }).expect(StatusCodes.UNAUTHORIZED);

		await request(server).post('/api/auth/login').send({ username, password: firstNewPassword }).expect(StatusCodes.UNAUTHORIZED);

		const finalLogin = await request(server).post('/api/auth/login').send({ username, password: secondNewPassword }).expect(StatusCodes.OK);

		expect(finalLogin.body).toHaveProperty('success', true);
	});

	it('should prevent reset token reuse across password reset flow', async () => {
		const { user } = await createAuthenticatedUser(request(server));

		// Generate reset token
		const { token, hashedToken } = generateResetToken();
		await redis.set(REDIS_KEYS.PASSWORD_RESET(hashedToken), user.id.toString(), { ex: 300 });

		// First reset succeeds
		const firstPassword = 'FirstPassword123!@#';
		await request(server)
			.post('/api/auth/reset-password')
			.send({ token, password: firstPassword, confirmPassword: firstPassword })
			.expect(StatusCodes.OK);

		// Verify token is deleted from Redis
		const tokenExists = await redis.get(REDIS_KEYS.PASSWORD_RESET(hashedToken));
		expect(tokenExists).toBeNull();

		// Attempt to reuse same token should fail
		const secondPassword = 'SecondPassword456!@#';
		await request(server)
			.post('/api/auth/reset-password')
			.send({ token, password: secondPassword, confirmPassword: secondPassword })
			.expect(StatusCodes.BAD_REQUEST);
	});

	// ========================================
	// Registration Validation Flows
	// ========================================

	it('should handle registration with various validation errors', async () => {
		const validUsername = generateTestUsername();
		const validEmail = generateTestEmail();
		const validPassword = generateTestPassword();

		// Missing username
		await request(server)
			.post('/api/auth/register')
			.send({ email: validEmail, password: validPassword, confirmPassword: validPassword })
			.expect(StatusCodes.BAD_REQUEST);

		// Missing email
		await request(server)
			.post('/api/auth/register')
			.send({ username: validUsername, password: validPassword, confirmPassword: validPassword })
			.expect(StatusCodes.BAD_REQUEST);

		// Missing password
		await request(server)
			.post('/api/auth/register')
			.send({ username: validUsername, email: validEmail, confirmPassword: validPassword })
			.expect(StatusCodes.BAD_REQUEST);

		// Missing confirmPassword
		await request(server)
			.post('/api/auth/register')
			.send({ username: validUsername, email: validEmail, password: validPassword })
			.expect(StatusCodes.BAD_REQUEST);

		// Passwords don't match
		await request(server)
			.post('/api/auth/register')
			.send({ username: validUsername, email: validEmail, password: validPassword, confirmPassword: 'Different123!@#' })
			.expect(StatusCodes.BAD_REQUEST);

		// Invalid email format
		await request(server)
			.post('/api/auth/register')
			.send({ username: validUsername, email: 'invalid-email', password: validPassword, confirmPassword: validPassword })
			.expect(StatusCodes.BAD_REQUEST);
	});

	it('should enforce username constraints during registration', async () => {
		const validEmail = generateTestEmail();
		const validPassword = generateTestPassword();

		// Username too short (< 3 chars)
		await request(server)
			.post('/api/auth/register')
			.send({ username: 'ab', email: validEmail, password: validPassword, confirmPassword: validPassword })
			.expect(StatusCodes.BAD_REQUEST);

		// Username too long (> 20 chars)
		await request(server)
			.post('/api/auth/register')
			.send({ username: 'a'.repeat(21), email: validEmail, password: validPassword, confirmPassword: validPassword })
			.expect(StatusCodes.BAD_REQUEST);

		// Username with special characters
		await request(server)
			.post('/api/auth/register')
			.send({ username: 'test@user', email: validEmail, password: validPassword, confirmPassword: validPassword })
			.expect(StatusCodes.BAD_REQUEST);
	});

	it('should enforce password complexity during registration', async () => {
		const validUsername = generateTestUsername();
		const validEmail = generateTestEmail();

		// Password too short
		let password = 'short';
		await request(server)
			.post('/api/auth/register')
			.send({ username: validUsername, email: validEmail, password, confirmPassword: password })
			.expect(StatusCodes.BAD_REQUEST);

		// No uppercase letter
		password = 'test123!@#';
		await request(server)
			.post('/api/auth/register')
			.send({ username: validUsername, email: validEmail, password, confirmPassword: password })
			.expect(StatusCodes.BAD_REQUEST);

		// No lowercase letter
		password = 'TEST123!@#';
		await request(server)
			.post('/api/auth/register')
			.send({ username: validUsername, email: validEmail, password, confirmPassword: password })
			.expect(StatusCodes.BAD_REQUEST);

		// No number
		password = 'TestPassword!@#';
		await request(server)
			.post('/api/auth/register')
			.send({ username: validUsername, email: validEmail, password, confirmPassword: password })
			.expect(StatusCodes.BAD_REQUEST);

		// No special character
		password = 'TestPassword123';
		await request(server)
			.post('/api/auth/register')
			.send({ username: validUsername, email: validEmail, password, confirmPassword: password })
			.expect(StatusCodes.BAD_REQUEST);
	});

	it('should prevent duplicate registrations and then allow login', async () => {
		const username = generateTestUsername();
		const email = generateTestEmail(username);
		const password = generateTestPassword();

		// First registration succeeds
		const registerResponse = await request(server)
			.post('/api/auth/register')
			.send({ username, email, password, confirmPassword: password })
			.expect(StatusCodes.CREATED);

		expect(registerResponse.body.data.user).toHaveProperty('username', username);
		expect(registerResponse.body.data.user).not.toHaveProperty('password');

		// Second registration with same username fails
		await request(server)
			.post('/api/auth/register')
			.send({ username, email: generateTestEmail(), password, confirmPassword: password })
			.expect(StatusCodes.CONFLICT);

		// Registration with same email fails
		await request(server)
			.post('/api/auth/register')
			.send({ username: generateTestUsername(), email, password, confirmPassword: password })
			.expect(StatusCodes.CONFLICT);

		// But user can login with original credentials
		const loginResponse = await request(server).post('/api/auth/login').send({ username, password }).expect(StatusCodes.OK);

		expect(loginResponse.body.data.user.username).toBe(username);
	});

	it('should set proper httpOnly cookies on successful registration', async () => {
		const username = generateTestUsername();
		const email = generateTestEmail(username);
		const password = generateTestPassword();

		const response = await request(server)
			.post('/api/auth/register')
			.send({ username, email, password, confirmPassword: password })
			.expect(StatusCodes.CREATED);

		const setCookieHeaders = response.headers['set-cookie'];
		expect(setCookieHeaders).toBeDefined();
		expect(Array.isArray(setCookieHeaders)).toBe(true);

		const accessTokenCookie = setCookieHeaders.find((cookie) => cookie.startsWith('accessToken='));
		const refreshTokenCookie = setCookieHeaders.find((cookie) => cookie.startsWith('refreshToken='));

		expect(accessTokenCookie).toBeDefined();
		expect(refreshTokenCookie).toBeDefined();
		expect(accessTokenCookie).toContain('HttpOnly');
		expect(refreshTokenCookie).toContain('HttpOnly');
	});

	// ========================================
	// Login & Authentication Flows
	// ========================================

	it('should handle login validation and errors correctly', async () => {
		// Register a user first
		const username = generateTestUsername();
		const email = generateTestEmail(username);
		const password = generateTestPassword();
		await request(server).post('/api/auth/register').send({ username, email, password, confirmPassword: password }).expect(StatusCodes.CREATED);

		// Missing username
		await request(server).post('/api/auth/login').send({ password }).expect(StatusCodes.BAD_REQUEST);

		// Missing password
		await request(server).post('/api/auth/login').send({ username }).expect(StatusCodes.BAD_REQUEST);

		// Non-existent user
		await request(server).post('/api/auth/login').send({ username: 'nonexistentuser', password }).expect(StatusCodes.UNAUTHORIZED);

		// Wrong password
		await request(server).post('/api/auth/login').send({ username, password: 'WrongPassword123!@#' }).expect(StatusCodes.UNAUTHORIZED);

		// Correct credentials should work
		const successResponse = await request(server).post('/api/auth/login').send({ username, password }).expect(StatusCodes.OK);

		expect(successResponse.body.data.user.username).toBe(username);
	});

	it('should update lastLogin timestamp and generate unique tokens on each login', async () => {
		const username = generateTestUsername();
		const email = generateTestEmail(username);
		const password = generateTestPassword();

		// Register
		const registerResponse = await request(server)
			.post('/api/auth/register')
			.send({ username, email, password, confirmPassword: password })
			.expect(StatusCodes.CREATED);

		const firstLoginTime = new Date(registerResponse.body.data.user.lastLoginAt);
		const firstCookies = extractCookies(registerResponse);

		// Wait to ensure timestamp difference
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Login again
		const loginResponse = await request(server).post('/api/auth/login').send({ username, password }).expect(StatusCodes.OK);

		const secondLoginTime = new Date(loginResponse.body.data.user.lastLoginAt);
		const secondCookies = extractCookies(loginResponse);

		// Verify timestamp updated
		expect(secondLoginTime.getTime()).toBeGreaterThan(firstLoginTime.getTime());

		// Verify tokens are different
		expect(firstCookies.accessToken).not.toBe(secondCookies.accessToken);
		expect(firstCookies.refreshToken).not.toBe(secondCookies.refreshToken);
	});

	// ========================================
	// Token Refresh Flows
	// ========================================

	it('should handle token refresh flow with validation', async () => {
		const { cookies, user } = await createAuthenticatedUser(request(server));

		// Refresh without token should fail
		await request(server).post('/api/auth/refresh').expect(StatusCodes.UNAUTHORIZED);

		// Refresh with invalid token should fail
		await request(server).post('/api/auth/refresh').set('Cookie', 'refreshToken=invalid.token.here').expect(StatusCodes.UNAUTHORIZED);

		// Wait for timestamp difference
		await new Promise((resolve) => setTimeout(resolve, 1100));

		// Valid refresh should work
		const refreshResponse = await request(server)
			.post('/api/auth/refresh')
			.set('Cookie', `refreshToken=${cookies.refreshToken}`)
			.expect(StatusCodes.OK);

		expect(refreshResponse.body).toHaveProperty('success', true);
		const newCookies = extractCookies(refreshResponse);
		expect(newCookies.accessToken).not.toBe(cookies.accessToken);

		// New token should work for protected routes
		const meResponse = await request(server)
			.get('/api/auth/me')
			.set('Cookie', formatCookieHeader({ accessToken: newCookies.accessToken }))
			.expect(StatusCodes.OK);

		expect(meResponse.body.data.user.username).toBe(user.username);
	});

	it('should invalidate refresh tokens after logout and new login', async () => {
		const username = generateTestUsername();
		const email = generateTestEmail(username);
		const password = generateTestPassword();

		// Register
		const registerResponse = await request(server)
			.post('/api/auth/register')
			.send({ username, email, password, confirmPassword: password })
			.expect(StatusCodes.CREATED);

		const initialCookies = extractCookies(registerResponse);

		// Logout
		await request(server).post('/api/auth/logout').set('Cookie', formatCookieHeader(initialCookies)).expect(StatusCodes.OK);

		// Old refresh token should not work
		await request(server).post('/api/auth/refresh').set('Cookie', `refreshToken=${initialCookies.refreshToken}`).expect(StatusCodes.UNAUTHORIZED);

		// Login again
		const loginResponse = await request(server).post('/api/auth/login').send({ username, password }).expect(StatusCodes.OK);

		const newCookies = extractCookies(loginResponse);

		// Old refresh token still shouldn't work
		await request(server).post('/api/auth/refresh').set('Cookie', `refreshToken=${initialCookies.refreshToken}`).expect(StatusCodes.UNAUTHORIZED);

		// New refresh token should work
		await request(server).post('/api/auth/refresh').set('Cookie', `refreshToken=${newCookies.refreshToken}`).expect(StatusCodes.OK);
	});

	// ========================================
	// Logout & Session Management Flows
	// ========================================

	it('should handle complete logout flow with validation', async () => {
		const { cookies } = await createAuthenticatedUser(request(server));

		// Verify user is authenticated
		await request(server).get('/api/auth/me').set('Cookie', formatCookieHeader(cookies)).expect(StatusCodes.OK);

		// Logout without token should fail
		await request(server).post('/api/auth/logout').expect(StatusCodes.UNAUTHORIZED);

		// Logout with invalid token should fail
		await request(server).post('/api/auth/logout').set('Cookie', 'accessToken=invalid.token.here').expect(StatusCodes.UNAUTHORIZED);

		// Valid logout should work
		const logoutResponse = await request(server).post('/api/auth/logout').set('Cookie', formatCookieHeader(cookies)).expect(StatusCodes.OK);

		expect(logoutResponse.body.data.message).toBe('Logged out successfully');

		// Verify cookies are cleared
		const setCookieHeaders = logoutResponse.headers['set-cookie'];
		expect(setCookieHeaders).toBeDefined();
		const cookieStrings = Array.isArray(setCookieHeaders) ? setCookieHeaders.join(';') : setCookieHeaders;
		expect(cookieStrings).toContain('accessToken');
		expect(cookieStrings).toContain('refreshToken');

		// Protected routes should no longer be accessible
		await request(server).get('/api/auth/me').set('Cookie', formatCookieHeader(cookies)).expect(StatusCodes.UNAUTHORIZED);
	});

	it('should handle re-login after logout successfully', async () => {
		const username = generateTestUsername();
		const email = generateTestEmail(username);
		const password = generateTestPassword();

		// Register
		const registerResponse = await request(server)
			.post('/api/auth/register')
			.send({ username, email, password, confirmPassword: password })
			.expect(StatusCodes.CREATED);

		const cookies = extractCookies(registerResponse);

		// Logout
		await request(server).post('/api/auth/logout').set('Cookie', formatCookieHeader(cookies)).expect(StatusCodes.OK);

		// Login again should work
		const loginResponse = await request(server).post('/api/auth/login').send({ username, password }).expect(StatusCodes.OK);

		expect(loginResponse.body).toHaveProperty('success', true);
		const newCookies = extractCookies(loginResponse);
		expect(newCookies).toHaveProperty('accessToken');
		expect(newCookies).toHaveProperty('refreshToken');

		// Should be able to access protected routes again
		await request(server).get('/api/auth/me').set('Cookie', formatCookieHeader(newCookies)).expect(StatusCodes.OK);
	});

	// ========================================
	// Password Reset Flows
	// ========================================

	it('should handle forgot password with various validation scenarios', async () => {
		const { username, email } = await createAuthenticatedUser(request(server));

		// Missing identifier
		await request(server).post('/api/auth/forgot-password').send({}).expect(StatusCodes.BAD_REQUEST);

		// Empty identifier
		await request(server).post('/api/auth/forgot-password').send({ identifier: '' }).expect(StatusCodes.BAD_REQUEST);

		// Valid username
		const usernameResponse = await request(server).post('/api/auth/forgot-password').send({ identifier: username }).expect(StatusCodes.OK);

		expect(usernameResponse.body.data.message).toContain('password reset link');

		// Clear rate limit for next test
		await redis.del(REDIS_KEYS.PASSWORD_RESET_BY_EMAIL(email));

		// Valid email
		const emailResponse = await request(server).post('/api/auth/forgot-password').send({ identifier: email }).expect(StatusCodes.OK);

		expect(emailResponse.body.data.message).toContain('password reset link');

		// Non-existent user (should return success to prevent enumeration)
		const nonExistentResponse = await request(server)
			.post('/api/auth/forgot-password')
			.send({ identifier: 'nonexistent@example.com' })
			.expect(StatusCodes.OK);

		expect(nonExistentResponse.body).toHaveProperty('success', true);
	});

	it('should handle forgot password rate limiting correctly', async () => {
		const { username, email } = await createAuthenticatedUser(request(server));

		// First request succeeds
		const firstResponse = await request(server).post('/api/auth/forgot-password').send({ identifier: username }).expect(StatusCodes.OK);

		expect(firstResponse.body).toHaveProperty('success', true);

		// Second request within rate limit window still returns success (rate limiting is transparent)
		const secondResponse = await request(server).post('/api/auth/forgot-password').send({ identifier: email }).expect(StatusCodes.OK);

		expect(secondResponse.body).toHaveProperty('success', true);

		// Concurrent requests should be handled gracefully
		const concurrentRequests = Array(3)
			.fill(null)
			.map(() => request(server).post('/api/auth/forgot-password').send({ identifier: username }));

		const responses = await Promise.all(concurrentRequests);
		for (const response of responses) {
			expect(response.status).toBe(StatusCodes.OK);
		}
	});

	it('should accept various valid email formats in forgot password', async () => {
		const testEmails = ['user+test@example.com', 'user.name@example.co.uk', 'user_name@test-domain.com'];

		for (const email of testEmails) {
			const response = await request(server).post('/api/auth/forgot-password').send({ identifier: email }).expect(StatusCodes.OK);

			expect(response.body).toHaveProperty('success', true);
		}
	});

	it('should handle complete password reset with validation', async () => {
		const { user, username, password: originalPassword } = await createAuthenticatedUser(request(server));

		// Create reset token
		const { token, hashedToken } = generateResetToken();
		await redis.set(REDIS_KEYS.PASSWORD_RESET(hashedToken), user.id.toString(), { ex: 300 });

		// Missing token
		await request(server)
			.post('/api/auth/reset-password')
			.send({ password: 'NewPassword123!@#', confirmPassword: 'NewPassword123!@#' })
			.expect(StatusCodes.BAD_REQUEST);

		// Missing password
		await request(server).post('/api/auth/reset-password').send({ token, confirmPassword: 'NewPassword123!@#' }).expect(StatusCodes.BAD_REQUEST);

		// Missing confirmPassword
		await request(server).post('/api/auth/reset-password').send({ token, password: 'NewPassword123!@#' }).expect(StatusCodes.BAD_REQUEST);

		// Passwords don't match
		await request(server)
			.post('/api/auth/reset-password')
			.send({ token, password: 'Password123!@#', confirmPassword: 'DifferentPassword123!@#' })
			.expect(StatusCodes.BAD_REQUEST);

		// Invalid token format
		await request(server)
			.post('/api/auth/reset-password')
			.send({ token: 'invalid-token', password: 'NewPassword123!@#', confirmPassword: 'NewPassword123!@#' })
			.expect(StatusCodes.BAD_REQUEST);

		// Valid reset should work
		const newPassword = 'NewPassword123!@#';
		const resetResponse = await request(server)
			.post('/api/auth/reset-password')
			.send({ token, password: newPassword, confirmPassword: newPassword })
			.expect(StatusCodes.OK);

		expect(resetResponse.body.data.message).toContain('reset successfully');

		// Verify old password no longer works
		await request(server).post('/api/auth/login').send({ username, password: originalPassword }).expect(StatusCodes.UNAUTHORIZED);

		// New password should work
		await request(server).post('/api/auth/login').send({ username, password: newPassword }).expect(StatusCodes.OK);

		// Token should be deleted from Redis
		const tokenExists = await redis.get(REDIS_KEYS.PASSWORD_RESET(hashedToken));
		expect(tokenExists).toBeNull();

		// Attempting to reuse token should fail
		await request(server)
			.post('/api/auth/reset-password')
			.send({ token, password: 'AnotherPassword456!@#', confirmPassword: 'AnotherPassword456!@#' })
			.expect(StatusCodes.BAD_REQUEST);
	});

	it('should enforce password complexity during password reset', async () => {
		const { user } = await createAuthenticatedUser(request(server));

		// Helper to test password validation
		const testPasswordReset = async (password) => {
			const { token, hashedToken } = generateResetToken();
			await redis.set(REDIS_KEYS.PASSWORD_RESET(hashedToken), user.id.toString(), { ex: 300 });

			return await request(server)
				.post('/api/auth/reset-password')
				.send({ token, password, confirmPassword: password })
				.expect(StatusCodes.BAD_REQUEST);
		};

		// Password too short
		await testPasswordReset('Sh0rt!');

		// No uppercase letter
		await testPasswordReset('password123!@#');

		// No lowercase letter
		await testPasswordReset('PASSWORD123!@#');

		// No number
		await testPasswordReset('PasswordNoNumber!@#');

		// No special character
		await testPasswordReset('Password123NoSpecial');
	});

	it('should handle expired reset tokens correctly', async () => {
		const { user } = await createAuthenticatedUser(request(server));
		const { token, hashedToken } = generateResetToken();

		// Store token with immediate expiration
		await redis.set(REDIS_KEYS.PASSWORD_RESET(hashedToken), user.id.toString(), { ex: 1 });

		// Wait for token to expire
		await new Promise((resolve) => setTimeout(resolve, 1100));

		const newPassword = 'NewPassword123!@#';
		const response = await request(server)
			.post('/api/auth/reset-password')
			.send({ token, password: newPassword, confirmPassword: newPassword })
			.expect(StatusCodes.BAD_REQUEST);

		expect(response.body.message).toMatch(/invalid|expired/i);
	});

	it('should handle concurrent password reset attempts gracefully', async () => {
		const { user, username } = await createAuthenticatedUser(request(server));
		const { token, hashedToken } = generateResetToken();
		await redis.set(REDIS_KEYS.PASSWORD_RESET(hashedToken), user.id.toString(), { ex: 300 });

		const newPassword = 'NewPassword123!@#';

		// Make multiple concurrent requests with the same token
		const requests = Array(3)
			.fill(null)
			.map(() => request(server).post('/api/auth/reset-password').send({ token, password: newPassword, confirmPassword: newPassword }));

		const responses = await Promise.all(requests);

		// At least one should succeed
		const successCount = responses.filter((r) => r.status === StatusCodes.OK).length;
		expect(successCount).toBeGreaterThanOrEqual(1);

		// All responses should be either success or bad request (no server errors)
		for (const response of responses) {
			expect([StatusCodes.OK, StatusCodes.BAD_REQUEST]).toContain(response.status);
		}

		// Verify the password was actually changed
		const loginResponse = await request(server).post('/api/auth/login').send({ username, password: newPassword }).expect(StatusCodes.OK);

		expect(loginResponse.body).toHaveProperty('success', true);
	});

	it('should handle password reset for non-existent user gracefully', async () => {
		const { token, hashedToken } = generateResetToken();
		const fakeUserId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
		await redis.set(REDIS_KEYS.PASSWORD_RESET(hashedToken), fakeUserId, { ex: 300 });

		const newPassword = 'NewPassword123!@#';
		const response = await request(server).post('/api/auth/reset-password').send({ token, password: newPassword, confirmPassword: newPassword });

		// Should fail with either BAD_REQUEST or NOT_FOUND depending on implementation
		expect(response.status).toBeGreaterThanOrEqual(400);
		expect(response.body).toHaveProperty('success', false);
	});

	// ========================================
	// Edge Cases & Advanced Scenarios
	// ========================================

	it('should handle protected routes without authentication', async () => {
		// No token
		await request(server).get('/api/auth/me').expect(StatusCodes.UNAUTHORIZED);

		// Invalid token
		await request(server).get('/api/auth/me').set('Cookie', 'accessToken=invalid.token.value').expect(StatusCodes.UNAUTHORIZED);

		// After creating and authenticating, should work
		const { cookies } = await createAuthenticatedUser(request(server));
		const meResponse = await request(server).get('/api/auth/me').set('Cookie', formatCookieHeader(cookies)).expect(StatusCodes.OK);

		expect(meResponse.body.data.user).toHaveProperty('username');
		expect(meResponse.body.data.user).not.toHaveProperty('password');
	});

	it('should return current user data on /me endpoint', async () => {
		const { user, cookies } = await createAuthenticatedUser(request(server));

		const response = await request(server).get('/api/auth/me').set('Cookie', formatCookieHeader(cookies)).expect(StatusCodes.OK);

		expect(response.body).toHaveProperty('success', true);
		expect(response.body.data).toHaveProperty('user');
		expect(response.body.data.user).toHaveProperty('username', user.username);
		expect(response.body.data.user).toHaveProperty('id', user.id);
		expect(response.body.data.user).toHaveProperty('email');
		expect(response.body.data.user).toHaveProperty('role');

		// Should not expose sensitive data
		expect(response.body.data.user).not.toHaveProperty('password');
		expect(response.body.data.user).not.toHaveProperty('sessionToken');
	});

	it('should handle /me endpoint with various invalid tokens', async () => {
		// No token
		await request(server).get('/api/auth/me').expect(StatusCodes.UNAUTHORIZED);

		// Invalid token format
		await request(server).get('/api/auth/me').set('Cookie', 'accessToken=invalid.token.here').expect(StatusCodes.UNAUTHORIZED);

		// Malformed JWT
		await request(server)
			.get('/api/auth/me')
			.set('Cookie', 'accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature')
			.expect(StatusCodes.UNAUTHORIZED);
	});
});
