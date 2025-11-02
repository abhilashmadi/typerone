import {
	generateAccessToken,
	generateRefreshToken,
	generateSessionToken,
	getAccessTokenCookieOptions,
	getRefreshTokenCookieOptions,
} from '../../lib/jwt.utils.js';
import User from '../../models/user.model.js';
import { UnauthorizedException } from '../../utils/exceptions.utils.js';

export async function loginHandler(request, reply) {
	const { username, password } = request.body;

	const user = await User.findOne({ username }).select('+password +sessionToken');
	if (!user) {
		throw new UnauthorizedException('Invalid credentials');
	}

	const isPasswordValid = await user.comparePassword(password);
	if (!isPasswordValid) {
		throw new UnauthorizedException('Invalid credentials');
	}

	if (!user.isActive) {
		throw new UnauthorizedException('Account is inactive');
	}

	const sessionToken = generateSessionToken();

	const payload = {
		userId: user._id.toString(),
		username: user.username,
		role: user.role,
		sessionToken,
	};

	const accessToken = generateAccessToken(payload);
	const refreshToken = generateRefreshToken(payload);

	user.sessionToken = sessionToken;
	await user.updateLastLogin();

	reply.setCookie('accessToken', accessToken, getAccessTokenCookieOptions());
	reply.setCookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

	return reply.success({ user: user.toObject() });
}
