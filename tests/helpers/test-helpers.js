/**
 * Helper utilities for testing authentication flows
 */

/**
 * Extracts cookies from supertest response
 * @param {Object} response - Supertest response object
 * @returns {Object} Object with cookie names as keys and values
 */
export function extractCookies(response) {
	const cookies = {};
	const setCookieHeader = response.headers['set-cookie'];

	if (!setCookieHeader) {
		return cookies;
	}

	const cookieArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

	for (const cookie of cookieArray) {
		const [nameValue] = cookie.split(';');
		const [name, value] = nameValue.split('=');
		cookies[name.trim()] = value.trim();
	}

	return cookies;
}

/**
 * Formats cookies object for use in request headers
 * @param {Object} cookies - Object with cookie names and values
 * @returns {string} Formatted cookie string
 */
export function formatCookieHeader(cookies) {
	return Object.entries(cookies)
		.map(([name, value]) => `${name}=${value}`)
		.join('; ');
}

/**
 * Creates a test user and returns authentication cookies
 * @param {Object} request - Supertest request object
 * @param {Object} userData - User data (username, password)
 * @returns {Promise<Object>} Object containing user data and cookies
 */
export async function createAuthenticatedUser(request, userData = {}) {
	const username = userData.username || generateTestUsername();
	const password = userData.password || 'Test123!@#';

	const response = await request.post('/api/auth/register').send({ username, password, confirmPassword: password }).expect(201);

	const cookies = extractCookies(response);

	return {
		user: response.body.data.user,
		cookies,
		username,
		password,
		accessToken: cookies.accessToken,
		refreshToken: cookies.refreshToken,
	};
}

/**
 * Generates a valid test username
 * @returns {string} Unique username for testing
 */
export function generateTestUsername() {
	// Generate a short unique username (max 20 chars)
	const timestamp = Date.now().toString().slice(-6); // Last 6 digits
	const random = Math.random().toString(36).substring(2, 5); // 3 random chars
	return `test${timestamp}${random}`;
}

/**
 * Generates a valid test password
 * @returns {string} Valid password for testing
 */
export function generateTestPassword() {
	return 'Test123!@#';
}

/**
 * Creates multiple test users
 * @param {Object} request - Supertest request object
 * @param {number} count - Number of users to create
 * @returns {Promise<Array>} Array of user objects with cookies
 */
export async function createMultipleUsers(request, count = 3) {
	const users = [];

	for (let i = 0; i < count; i++) {
		const userData = await createAuthenticatedUser(request);
		users.push(userData);
	}

	return users;
}
