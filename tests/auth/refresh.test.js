import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../lib/app.js';
import { StatusCodes } from '../../utils/status-codes.utils.js';
import { createAuthenticatedUser, extractCookies, formatCookieHeader, generateTestPassword, generateTestUsername } from '../helpers/test-helpers.js';

describe('POST /api/auth/refresh', () => {
	let app;
	let server;

	beforeAll(async () => {
		app = await buildApp();
		await app.ready();
		await app.listen({ port: 0 });
		server = app.server;
	});

	afterAll(async () => {
		await app.close();
	});

	it('should refresh access token with valid refresh token', async () => {
		const { cookies } = await createAuthenticatedUser(request(server));

		// Wait a moment to ensure token timestamp difference
		await new Promise((resolve) => setTimeout(resolve, 1100));

		const response = await request(server).post('/api/auth/refresh').set('Cookie', `refreshToken=${cookies.refreshToken}`).expect(StatusCodes.OK);

		expect(response.body).toHaveProperty('success', true);
		expect(response.body.data).toHaveProperty('message', 'Token refreshed successfully');

		// Should receive new access token
		const newCookies = extractCookies(response);
		expect(newCookies).toHaveProperty('accessToken');
		// Tokens should be different due to different timestamps (JWT uses seconds, not milliseconds)
		expect(newCookies.accessToken).not.toBe(cookies.accessToken);
	});

	it('should allow using new access token after refresh', async () => {
		const { cookies, user } = await createAuthenticatedUser(request(server));

		// Refresh token
		const refreshResponse = await request(server)
			.post('/api/auth/refresh')
			.set('Cookie', `refreshToken=${cookies.refreshToken}`)
			.expect(StatusCodes.OK);

		const newCookies = extractCookies(refreshResponse);

		// Use new access token to access protected route
		const meResponse = await request(server)
			.get('/api/auth/me')
			.set(
				'Cookie',
				formatCookieHeader({
					accessToken: newCookies.accessToken,
				}),
			)
			.expect(StatusCodes.OK);

		expect(meResponse.body.data.user).toHaveProperty('username', user.username);
	});

	it('should reject refresh without refresh token', async () => {
		const response = await request(server).post('/api/auth/refresh').expect(StatusCodes.UNAUTHORIZED);

		expect(response.body).toHaveProperty('success', false);
		expect(response.body).toHaveProperty('message', 'Refresh token not found');
	});

	it('should reject refresh with invalid refresh token', async () => {
		const response = await request(server)
			.post('/api/auth/refresh')
			.set('Cookie', 'refreshToken=invalid.token.here')
			.expect(StatusCodes.UNAUTHORIZED);

		expect(response.body).toHaveProperty('success', false);
	});

	it('should reject refresh token after logout', async () => {
		const { cookies } = await createAuthenticatedUser(request(server));

		// Logout
		await request(server).post('/api/auth/logout').set('Cookie', formatCookieHeader(cookies)).expect(StatusCodes.OK);

		// Try to use refresh token after logout
		const response = await request(server)
			.post('/api/auth/refresh')
			.set('Cookie', `refreshToken=${cookies.refreshToken}`)
			.expect(StatusCodes.UNAUTHORIZED);

		expect(response.body).toHaveProperty('success', false);
		expect(response.body.message).toMatch(/session/i);
	});

	it('should invalidate old refresh token after new login', async () => {
		const username = generateTestUsername();
		const password = generateTestPassword();

		// Register and get first tokens
		const firstRegister = await request(server)
			.post('/api/auth/register')
			.send({ username, password, confirmPassword: password })
			.expect(StatusCodes.CREATED);

		const firstCookies = extractCookies(firstRegister);

		// Login again to get new tokens
		await request(server).post('/api/auth/login').send({ username, password }).expect(StatusCodes.OK);

		// Old refresh token should not work
		const response = await request(server)
			.post('/api/auth/refresh')
			.set('Cookie', `refreshToken=${firstCookies.refreshToken}`)
			.expect(StatusCodes.UNAUTHORIZED);

		expect(response.body).toHaveProperty('success', false);
	});
});
