import { generateAccessToken, getAccessTokenCookieOptions, verifyRefreshToken } from '../../lib/jwt.utils.js';
import User from '../../models/user.model.js';
import { UnauthorizedException } from '../../utils/exceptions.utils.js';

export async function refreshHandler(request, reply) {
	const refreshToken = request.cookies.refreshToken;

	if (!refreshToken) {
		throw new UnauthorizedException('Refresh token not found');
	}

	const decoded = verifyRefreshToken(refreshToken);

	const user = await User.findById(decoded.userId).select('+sessionToken');
	if (!user || user.sessionToken !== decoded.sessionToken) {
		throw new UnauthorizedException('Session expired or invalid');
	}

	const payload = {
		userId: decoded.userId,
		username: decoded.username,
		role: decoded.role,
		sessionToken: decoded.sessionToken,
	};

	const newAccessToken = generateAccessToken(payload);

	reply.setCookie('accessToken', newAccessToken, getAccessTokenCookieOptions());

	return reply.success({ message: 'Token refreshed successfully' });
}
