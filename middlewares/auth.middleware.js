import { verifyAccessToken } from '../lib/jwt.utils.js';
import User from '../models/user.model.js';
import { UnauthorizedException } from '../utils/exceptions.utils.js';

export async function authenticate(request) {
	const accessToken = request.cookies.accessToken;

	if (!accessToken) {
		throw new UnauthorizedException('Access token not found');
	}

	const decoded = verifyAccessToken(accessToken);
	const user = await User.findById(decoded.userId).select('+sessionToken');

	if (!user) {
		throw new UnauthorizedException('User not found');
	}

	if (user.sessionToken !== decoded.sessionToken) {
		throw new UnauthorizedException('Session expired or logged in from another device');
	}

	if (!user.isActive) {
		throw new UnauthorizedException('Account is inactive');
	}

	request.user = decoded;
}
