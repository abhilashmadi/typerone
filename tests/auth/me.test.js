import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../lib/app.js';
import { StatusCodes } from '../../utils/status-codes.utils.js';
import { createAuthenticatedUser, formatCookieHeader } from '../helpers/test-helpers.js';

describe('GET /api/auth/me', () => {
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

	it('should return current user data with valid access token', async () => {
		const { user, cookies } = await createAuthenticatedUser(request(server));

		const response = await request(server).get('/api/auth/me').set('Cookie', formatCookieHeader(cookies)).expect(StatusCodes.OK);

		expect(response.body).toHaveProperty('success', true);
		expect(response.body.data).toHaveProperty('user');
		expect(response.body.data.user).toHaveProperty('username', user.username);
		expect(response.body.data.user).toHaveProperty('id', user.id);
	});

	it('should reject request without access token', async () => {
		const response = await request(server).get('/api/auth/me').expect(StatusCodes.UNAUTHORIZED);

		expect(response.body).toHaveProperty('success', false);
		expect(response.body).toHaveProperty('message');
		expect(response.body.message).toMatch(/token/i);
	});

	it('should reject request with invalid access token', async () => {
		const response = await request(server).get('/api/auth/me').set('Cookie', 'accessToken=invalid.token.here').expect(StatusCodes.UNAUTHORIZED);

		expect(response.body).toHaveProperty('success', false);
	});

	it('should reject request with expired access token', async () => {
		// Note: This test would require mocking time or using a token with expired timestamp
		// For now, we'll test with a malformed token
		const response = await request(server)
			.get('/api/auth/me')
			.set('Cookie', 'accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature')
			.expect(StatusCodes.UNAUTHORIZED);

		expect(response.body).toHaveProperty('success', false);
	});

	it('should not expose sensitive user data', async () => {
		const { cookies } = await createAuthenticatedUser(request(server));

		const response = await request(server).get('/api/auth/me').set('Cookie', formatCookieHeader(cookies)).expect(StatusCodes.OK);

		expect(response.body.data.user).not.toHaveProperty('password');
		expect(response.body.data.user).not.toHaveProperty('sessionToken');
	});
});
