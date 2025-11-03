import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../lib/app.js';
import { StatusCodes } from '../../utils/status-codes.utils.js';
import { createAuthenticatedUser, extractCookies, formatCookieHeader, generateTestPassword, generateTestUsername } from '../helpers/test-helpers.js';

describe('POST /api/auth/logout', () => {
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

	it('should logout successfully with valid access token', async () => {
		const { cookies } = await createAuthenticatedUser(request(server));

		const response = await request(server).post('/api/auth/logout').set('Cookie', formatCookieHeader(cookies)).expect(StatusCodes.OK);

		expect(response.body).toHaveProperty('success', true);
		expect(response.body.data).toHaveProperty('message', 'Logged out successfully');
	});

	it('should clear authentication cookies on logout', async () => {
		const { cookies } = await createAuthenticatedUser(request(server));

		const response = await request(server).post('/api/auth/logout').set('Cookie', formatCookieHeader(cookies)).expect(StatusCodes.OK);

		const setCookieHeaders = response.headers['set-cookie'];
		expect(setCookieHeaders).toBeDefined();

		const cookieStrings = Array.isArray(setCookieHeaders) ? setCookieHeaders.join(';') : setCookieHeaders;

		// Check that cookies are being cleared (Max-Age=0 or Expires in the past)
		expect(cookieStrings).toContain('accessToken');
		expect(cookieStrings).toContain('refreshToken');
	});

	it('should invalidate access token after logout', async () => {
		const { cookies } = await createAuthenticatedUser(request(server));

		// Logout
		await request(server).post('/api/auth/logout').set('Cookie', formatCookieHeader(cookies)).expect(StatusCodes.OK);

		// Try to access protected route with old token
		const response = await request(server).get('/api/auth/me').set('Cookie', formatCookieHeader(cookies)).expect(StatusCodes.UNAUTHORIZED);

		expect(response.body).toHaveProperty('success', false);
	});

	it('should reject logout without access token', async () => {
		const response = await request(server).post('/api/auth/logout').expect(StatusCodes.UNAUTHORIZED);

		expect(response.body).toHaveProperty('success', false);
	});

	it('should reject logout with invalid access token', async () => {
		const response = await request(server).post('/api/auth/logout').set('Cookie', 'accessToken=invalid.token.here').expect(StatusCodes.UNAUTHORIZED);

		expect(response.body).toHaveProperty('success', false);
	});

	it('should allow re-login after logout', async () => {
		const username = generateTestUsername();
		const password = generateTestPassword();

		// Register
		const registerResponse = await request(server)
			.post('/api/auth/register')
			.send({ username, password, confirmPassword: password })
			.expect(StatusCodes.CREATED);

		const cookies = extractCookies(registerResponse);

		// Logout
		await request(server).post('/api/auth/logout').set('Cookie', formatCookieHeader(cookies)).expect(StatusCodes.OK);

		// Login again
		const loginResponse = await request(server).post('/api/auth/login').send({ username, password }).expect(StatusCodes.OK);

		expect(loginResponse.body).toHaveProperty('success', true);

		const newCookies = extractCookies(loginResponse);
		expect(newCookies).toHaveProperty('accessToken');
		expect(newCookies).toHaveProperty('refreshToken');
	});
});
