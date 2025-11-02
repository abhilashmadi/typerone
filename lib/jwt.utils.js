import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { envConfig } from '../configs/env.config.js';
import { UnauthorizedException } from '../utils/exceptions.utils.js';

export function generateAccessToken(payload) {
	return jwt.sign(payload, envConfig.JWT_SECRET, {
		expiresIn: envConfig.JWT_ACCESS_TOKEN_EXPIRY,
	});
}

export function generateRefreshToken(payload) {
	return jwt.sign(payload, envConfig.JWT_SECRET, {
		expiresIn: envConfig.JWT_REFRESH_TOKEN_EXPIRY,
	});
}

export function verifyAccessToken(token) {
	try {
		return jwt.verify(token, envConfig.JWT_SECRET);
	} catch {
		throw new UnauthorizedException('Invalid or expired access token');
	}
}

export function verifyRefreshToken(token) {
	try {
		return jwt.verify(token, envConfig.JWT_SECRET);
	} catch {
		throw new UnauthorizedException('Invalid or expired refresh token');
	}
}

export function generateSessionToken() {
	return crypto.randomBytes(32).toString('hex');
}

export function getAccessTokenCookieOptions() {
	return {
		httpOnly: true,
		secure: envConfig.MODE === 'production',
		sameSite: 'strict',
		domain: envConfig.COOKIE_DOMAIN,
		path: '/',
		maxAge: parseExpiry(envConfig.JWT_ACCESS_TOKEN_EXPIRY) * 1000,
	};
}

export function getRefreshTokenCookieOptions() {
	return {
		...getAccessTokenCookieOptions(),
		maxAge: parseExpiry(envConfig.JWT_REFRESH_TOKEN_EXPIRY) * 1000,
	};
}

// Parse expiry string to seconds
function parseExpiry(expiry) {
	const match = expiry.match(/^(\d+)([smhd])$/);
	if (!match) return 900; // Default 15 minutes

	const value = Number.parseInt(match[1], 10);
	const unit = match[2];

	switch (unit) {
		case 's':
			return value;
		case 'm':
			return value * 60;
		case 'h':
			return value * 60 * 60;
		case 'd':
			return value * 60 * 60 * 24;
		default:
			return 900;
	}
}
