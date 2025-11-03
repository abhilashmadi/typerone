import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../lib/app.js';
import { StatusCodes } from '../../utils/status-codes.utils.js';
import { extractCookies, generateTestPassword, generateTestUsername } from '../helpers/test-helpers.js';

describe('POST /api/auth/register', () => {
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

	it('should register a new user with valid credentials', async () => {
		const username = generateTestUsername();
		const password = generateTestPassword();

		const response = await request(server)
			.post('/api/auth/register')
			.send({ username, password, confirmPassword: password })
			.expect(StatusCodes.CREATED);

		expect(response.body).toHaveProperty('success', true);
		expect(response.body.data).toHaveProperty('user');
		expect(response.body.data.user).toHaveProperty('username', username);
		expect(response.body.data.user).toHaveProperty('role', 'user');
		expect(response.body.data.user).toHaveProperty('isActive', true);
		expect(response.body.data.user).not.toHaveProperty('password');

		// Check for authentication cookies
		const cookies = extractCookies(response);
		expect(cookies).toHaveProperty('accessToken');
		expect(cookies).toHaveProperty('refreshToken');
	});

	it('should set httpOnly cookies on successful registration', async () => {
		const username = generateTestUsername();
		const password = generateTestPassword();

		const response = await request(server)
			.post('/api/auth/register')
			.send({ username, password, confirmPassword: password })
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

	it('should reject registration with duplicate username', async () => {
		const username = generateTestUsername();
		const password = generateTestPassword();

		// Register first user
		await request(server).post('/api/auth/register').send({ username, password, confirmPassword: password }).expect(StatusCodes.CREATED);

		// Try to register with same username
		const response = await request(server)
			.post('/api/auth/register')
			.send({ username, password, confirmPassword: password })
			.expect(StatusCodes.CONFLICT);

		expect(response.body).toHaveProperty('success', false);
		expect(response.body).toHaveProperty('message', 'Username already exists');
	});

	it('should reject registration with missing username', async () => {
		const response = await request(server).post('/api/auth/register').send({ password: generateTestPassword() }).expect(StatusCodes.BAD_REQUEST);

		expect(response.body).toHaveProperty('success', false);
	});

	it('should reject registration with missing password', async () => {
		const response = await request(server)
			.post('/api/auth/register')
			.send({ username: generateTestUsername(), confirmPassword: 'Test123!@#' })
			.expect(StatusCodes.BAD_REQUEST);

		expect(response.body).toHaveProperty('success', false);
	});

	it('should reject registration with missing confirmPassword', async () => {
		const response = await request(server)
			.post('/api/auth/register')
			.send({ username: generateTestUsername(), password: generateTestPassword() })
			.expect(StatusCodes.BAD_REQUEST);

		expect(response.body).toHaveProperty('success', false);
	});

	it('should reject registration with invalid username (too short)', async () => {
		const password = generateTestPassword();
		const response = await request(server)
			.post('/api/auth/register')
			.send({ username: 'ab', password, confirmPassword: password })
			.expect(StatusCodes.BAD_REQUEST);

		expect(response.body).toHaveProperty('success', false);
	});

	it('should reject registration with invalid password (too short)', async () => {
		const password = 'short';
		const response = await request(server)
			.post('/api/auth/register')
			.send({ username: generateTestUsername(), password, confirmPassword: password })
			.expect(StatusCodes.BAD_REQUEST);

		expect(response.body).toHaveProperty('success', false);
	});

	it('should reject registration with invalid password (no uppercase)', async () => {
		const password = 'test123!@#';
		const response = await request(server)
			.post('/api/auth/register')
			.send({ username: generateTestUsername(), password, confirmPassword: password })
			.expect(StatusCodes.BAD_REQUEST);

		expect(response.body).toHaveProperty('success', false);
	});

	it('should reject registration with invalid password (no lowercase)', async () => {
		const password = 'TEST123!@#';
		const response = await request(server)
			.post('/api/auth/register')
			.send({ username: generateTestUsername(), password, confirmPassword: password })
			.expect(StatusCodes.BAD_REQUEST);

		expect(response.body).toHaveProperty('success', false);
	});

	it('should reject registration with invalid password (no number)', async () => {
		const password = 'TestPassword!@#';
		const response = await request(server)
			.post('/api/auth/register')
			.send({ username: generateTestUsername(), password, confirmPassword: password })
			.expect(StatusCodes.BAD_REQUEST);

		expect(response.body).toHaveProperty('success', false);
	});

	it('should reject registration with invalid password (no special character)', async () => {
		const password = 'TestPassword123';
		const response = await request(server)
			.post('/api/auth/register')
			.send({ username: generateTestUsername(), password, confirmPassword: password })
			.expect(StatusCodes.BAD_REQUEST);

		expect(response.body).toHaveProperty('success', false);
	});
});
