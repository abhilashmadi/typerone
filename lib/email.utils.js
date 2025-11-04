import { createLogger } from '../utils/logger.utils.js';

/**
 * Email utility functions for sending various types of emails
 * Currently logs to console - integrate with email service provider later
 */

const logger = createLogger('EmailService');

/**
 * Send password reset email with reset token
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.username - User's username
 * @param {string} params.resetToken - Password reset token
 * @param {string} params.resetLink - Full password reset link
 */
export async function sendPasswordResetEmail({ to, username, resetToken, resetLink }) {
	// TODO: Integrate with email service provider (SendGrid, AWS SES, etc.)
	// For now, just log the details to console

	logger.info('📧 Password Reset Email');
	logger.info('='.repeat(50));
	logger.info(`To: ${to}`);
	logger.info(`Username: ${username}`);
	logger.info(`Reset Token: ${resetToken}`);
	logger.info(`Reset Link: ${resetLink}`);
	logger.info('='.repeat(50));

	console.log('\n--- PASSWORD RESET EMAIL ---');
	console.log(`To: ${to}`);
	console.log(`Subject: Password Reset Request`);
	console.log('\nEmail Body:');
	console.log(`Hello ${username},\n`);
	console.log('You requested to reset your password. Please use the link below to reset your password:');
	console.log(`\n${resetLink}\n`);
	console.log('This link will expire in 5 minutes.');
	console.log('\nIf you did not request this, please ignore this email.');
	console.log('\nBest regards,');
	console.log('TyperOne Team');
	console.log('--- END EMAIL ---\n');

	return {
		success: true,
		messageId: `mock-${Date.now()}`,
	};
}

/**
 * Send welcome email to new users
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.username - User's username
 */
export async function sendWelcomeEmail({ to, username }) {
	logger.info('📧 Welcome Email');
	logger.info('='.repeat(50));
	logger.info(`To: ${to}`);
	logger.info(`Username: ${username}`);
	logger.info('='.repeat(50));

	console.log('\n--- WELCOME EMAIL ---');
	console.log(`To: ${to}`);
	console.log(`Subject: Welcome to TyperOne!`);
	console.log('\nEmail Body:');
	console.log(`Hello ${username},\n`);
	console.log('Welcome to TyperOne! Your account has been successfully created.');
	console.log('\nStart improving your typing speed today!');
	console.log('\nBest regards,');
	console.log('TyperOne Team');
	console.log('--- END EMAIL ---\n');

	return {
		success: true,
		messageId: `mock-${Date.now()}`,
	};
}

/**
 * Send password changed confirmation email
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.username - User's username
 */
export async function sendPasswordChangedEmail({ to, username }) {
	logger.info('📧 Password Changed Email');
	logger.info('='.repeat(50));
	logger.info(`To: ${to}`);
	logger.info(`Username: ${username}`);
	logger.info('='.repeat(50));

	console.log('\n--- PASSWORD CHANGED EMAIL ---');
	console.log(`To: ${to}`);
	console.log(`Subject: Password Changed Successfully`);
	console.log('\nEmail Body:');
	console.log(`Hello ${username},\n`);
	console.log('Your password has been successfully changed.');
	console.log('\nIf you did not make this change, please contact support immediately.');
	console.log('\nBest regards,');
	console.log('TyperOne Team');
	console.log('--- END EMAIL ---\n');

	return {
		success: true,
		messageId: `mock-${Date.now()}`,
	};
}
