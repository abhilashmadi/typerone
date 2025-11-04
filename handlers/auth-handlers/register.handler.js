import {
	generateAccessToken,
	generateRefreshToken,
	generateSessionToken,
	getAccessTokenCookieOptions,
	getRefreshTokenCookieOptions,
} from '../../lib/jwt.utils.js';
import User from '../../models/user.model.js';
import { ConflictException } from '../../utils/exceptions.utils.js';
import { StatusCodes } from '../../utils/status-codes.utils.js';

export async function registerHandler(request, reply) {
	const { username, email, password } = request.body;

	// Check if username or email already exists
	const existingUser = await User.findOne({
		$or: [{ username }, { email }],
	});

	if (existingUser) {
		if (existingUser.username === username) {
			throw new ConflictException('Username already exists');
		}
		if (existingUser.email === email) {
			throw new ConflictException('Email already exists');
		}
	}

	const sessionToken = generateSessionToken();

	const user = await User.create({
		username,
		email,
		password,
		sessionToken,
	});

	const payload = {
		userId: user._id.toString(),
		username: user.username,
		role: user.role,
		sessionToken,
	};

	const accessToken = generateAccessToken(payload);
	const refreshToken = generateRefreshToken(payload);

	reply.setCookie('accessToken', accessToken, getAccessTokenCookieOptions());
	reply.setCookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

	return reply.success({ user: user.toObject() }, StatusCodes.CREATED);
}
