import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../lib/app.js';
import { StatusCodes } from '../../utils/status-codes.utils.js';
import { extractCookies, generateTestPassword, generateTestUsername } from '../helpers/test-helpers.js';

describe('POST /api/auth/login', () => {
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

	it('should login with valid credentials', async () => {
		const username = generateTestUsername();
		const password = generateTestPassword();

		// First register the user
		await request(server).post('/api/auth/register').send({ username, password, confirmPassword: password }).expect(StatusCodes.CREATED);

		// Then login
		const response = await request(server).post('/api/auth/login').send({ username, password }).expect(StatusCodes.OK);

		expect(response.body).toHaveProperty('success', true);
		expect(response.body.data).toHaveProperty('user');
		expect(response.body.data.user).toHaveProperty('username', username);

		// Check for authentication cookies
		const cookies = extractCookies(response);
		expect(cookies).toHaveProperty('accessToken');
		expect(cookies).toHaveProperty('refreshToken');
	});

	it('should update lastLogin timestamp on successful login', async () => {
		const username = generateTestUsername();
		const password = generateTestPassword();

		// Register user
		const registerResponse = await request(server)
			.post('/api/auth/register')
			.send({ username, password, confirmPassword: password })
			.expect(StatusCodes.CREATED);

		const firstLoginTime = new Date(registerResponse.body.data.user.lastLoginAt);

		// Wait a moment to ensure timestamp difference
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Login again
		const loginResponse = await request(server).post('/api/auth/login').send({ username, password }).expect(StatusCodes.OK);

		const secondLoginTime = new Date(loginResponse.body.data.user.lastLoginAt);

		expect(secondLoginTime.getTime()).toBeGreaterThan(firstLoginTime.getTime());
	});

	it('should reject login with non-existent username', async () => {
		const response = await request(server)
			.post('/api/auth/login')
			.send({
				username: 'nonexistentuser',
				password: generateTestPassword(),
			})
			.expect(StatusCodes.UNAUTHORIZED);

		expect(response.body).toHaveProperty('success', false);
		expect(response.body).toHaveProperty('message', 'Invalid credentials');
	});

	it('should reject login with incorrect password', async () => {
		const username = generateTestUsername();
		const password = generateTestPassword();

		// Register user
		await request(server).post('/api/auth/register').send({ username, password, confirmPassword: password }).expect(StatusCodes.CREATED);

		// Try login with wrong password
		const response = await request(server)
			.post('/api/auth/login')
			.send({ username, password: 'WrongPassword123!@#' })
			.expect(StatusCodes.UNAUTHORIZED);

		expect(response.body).toHaveProperty('success', false);
		expect(response.body).toHaveProperty('message', 'Invalid credentials');
	});

	it('should reject login with missing username', async () => {
		const response = await request(server).post('/api/auth/login').send({ password: generateTestPassword() }).expect(StatusCodes.BAD_REQUEST);

		expect(response.body).toHaveProperty('success', false);
	});

	it('should reject login with missing password', async () => {
		const response = await request(server).post('/api/auth/login').send({ username: generateTestUsername() }).expect(StatusCodes.BAD_REQUEST);

		expect(response.body).toHaveProperty('success', false);
	});

	it('should generate new session token on each login', async () => {
		const username = generateTestUsername();
		const password = generateTestPassword();

		// Register user
		await request(server).post('/api/auth/register').send({ username, password, confirmPassword: password }).expect(StatusCodes.CREATED);

		// First login
		const firstLogin = await request(server).post('/api/auth/login').send({ username, password }).expect(StatusCodes.OK);

		const firstCookies = extractCookies(firstLogin);

		// Second login
		const secondLogin = await request(server).post('/api/auth/login').send({ username, password }).expect(StatusCodes.OK);

		const secondCookies = extractCookies(secondLogin);

		// Tokens should be different
		expect(firstCookies.accessToken).not.toBe(secondCookies.accessToken);
		expect(firstCookies.refreshToken).not.toBe(secondCookies.refreshToken);
	});
});
