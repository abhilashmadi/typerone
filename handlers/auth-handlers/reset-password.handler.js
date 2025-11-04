import { getRedisClient, REDIS_KEYS } from '../../configs/redis.config.js';
import { sendPasswordChangedEmail } from '../../lib/email.utils.js';
import { hashToken } from '../../lib/jwt.utils.js';
import User from '../../models/user.model.js';
import { BadRequestException, NotFoundException } from '../../utils/exceptions.utils.js';
import { StatusCodes } from '../../utils/status-codes.utils.js';

/**
 * Reset Password Handler
 * Validates reset token from Redis and updates user password
 */
export async function resetPasswordHandler(request, reply) {
	const { token, password } = request.body;

	// Hash the token to match stored format
	const hashedToken = hashToken(token);

	const redis = getRedisClient();

	// Get user ID from Redis
	const userId = await redis.get(REDIS_KEYS.PASSWORD_RESET(hashedToken));

	if (!userId) {
		throw new BadRequestException('Invalid or expired reset token. Please request a new password reset.');
	}

	// Find user with password field included
	const user = await User.findById(userId).select('+password');

	if (!user || !user.isActive) {
		throw new NotFoundException('User not found');
	}

	// Update password (will be hashed by pre-save hook)
	user.password = password;
	await user.save();

	// Delete reset token from Redis (cleanup)
	// Also delete the email-based rate limiting key
	await Promise.all([redis.del(REDIS_KEYS.PASSWORD_RESET(hashedToken)), redis.del(REDIS_KEYS.PASSWORD_RESET_BY_EMAIL(user.email))]);

	// Send password changed confirmation email
	await sendPasswordChangedEmail({
		to: user.email,
		username: user.username,
	});

	return reply.success(
		{
			message: 'Password has been reset successfully. You can now login with your new password.',
		},
		StatusCodes.OK,
	);
}
