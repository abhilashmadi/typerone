import { envConfig } from '../../configs/env.config.js';
import User from '../../models/user.model.js';

export async function logoutHandler(request, reply) {
	const { userId } = request.user;

	await User.findByIdAndUpdate(userId, { sessionToken: null });

	reply.clearCookie('accessToken', {
		domain: envConfig.COOKIE_DOMAIN,
		path: '/',
	});

	reply.clearCookie('refreshToken', {
		domain: envConfig.COOKIE_DOMAIN,
		path: '/',
	});

	return reply.success({ message: 'Logged out successfully' });
}
