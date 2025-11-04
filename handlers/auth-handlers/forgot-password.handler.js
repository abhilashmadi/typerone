import { getRedisClient, REDIS_KEYS, REDIS_TTL } from '../../configs/redis.config.js';
import { sendPasswordResetEmail } from '../../lib/email.utils.js';
import { generateResetToken } from '../../lib/jwt.utils.js';
import User from '../../models/user.model.js';
import { NotFoundException } from '../../utils/exceptions.utils.js';
import { StatusCodes } from '../../utils/status-codes.utils.js';

/**
 * Forgot Password Handler
 * Generates a password reset token, stores it in Redis, and sends reset email
 * Accepts either username or email as identifier
 */
export async function forgotPasswordHandler(request, reply) {
	const { identifier } = request.body;

	// Determine if identifier is email or username
	const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

	// Find user by email or username
	const user = await User.findOne(isEmail ? { email: identifier } : { username: identifier });

	if (!user) {
		throw new NotFoundException('No account found with that username or email address');
	}

	// Check if user is active
	if (!user.isActive) {
		throw new NotFoundException('No account found with that username or email address');
	}

	const redis = getRedisClient();

	// Check if there's already a recent reset request (rate limiting by email)
	const existingToken = await redis.get(REDIS_KEYS.PASSWORD_RESET_BY_EMAIL(user.email));
	if (existingToken) {
		// Return success to prevent email enumeration, but don't send another email
		return reply.success(
			{
				message: 'If an account exists with that username or email, a password reset link has been sent.',
			},
			StatusCodes.OK,
		);
	}

	// Generate secure reset token
	const { token: resetToken, hashedToken } = generateResetToken();

	// Store hashed token in Redis with user ID
	// Using two keys: one for token lookup, one for email-based rate limiting
	await Promise.all([
		redis.set(REDIS_KEYS.PASSWORD_RESET(hashedToken), user._id.toString(), {
			ex: REDIS_TTL.PASSWORD_RESET,
		}),
		redis.set(REDIS_KEYS.PASSWORD_RESET_BY_EMAIL(user.email), hashedToken, {
			ex: REDIS_TTL.PASSWORD_RESET,
		}),
	]);

	// Generate reset link (frontend will handle this route)
	// In production, use your frontend domain
	const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

	// Send password reset email
	await sendPasswordResetEmail({
		to: user.email,
		username: user.username,
		resetToken,
		resetLink,
	});

	return reply.success(
		{
			message: 'If an account exists with that username or email, a password reset link has been sent.',
		},
		StatusCodes.OK,
	);
}
