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
	const { username, password } = request.body;

	const existingUser = await User.findOne({ username });
	if (existingUser) {
		throw new ConflictException('Username already exists');
	}

	const sessionToken = generateSessionToken();

	const user = await User.create({
		username,
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
