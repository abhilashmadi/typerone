import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../lib/app.js';
import { StatusCodes } from '../../utils/status-codes.utils.js';
import { createAuthenticatedUser, extractCookies, formatCookieHeader, generateTestPassword, generateTestUsername } from '../helpers/test-helpers.js';

describe('Authentication Flow Integration', () => {
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

	it('should complete full authentication lifecycle', async () => {
		const username = generateTestUsername();
		const password = generateTestPassword();

		// 1. Register
		const registerResponse = await request(server)
			.post('/api/auth/register')
			.send({ username, password, confirmPassword: password })
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
});
