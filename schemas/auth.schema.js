export const registerSchema = {
	body: {
		type: 'object',
		required: ['username', 'email', 'password', 'confirmPassword'],
		properties: {
			username: {
				type: 'string',
				minLength: 3,
				maxLength: 20,
				pattern: '^[a-zA-Z0-9_-]+$',
			},
			email: {
				type: 'string',
				format: 'email',
			},
			password: {
				type: 'string',
				minLength: 8,
			},
			confirmPassword: {
				type: 'string',
				minLength: 1,
			},
		},
		additionalProperties: false,
	},
};

export const loginSchema = {
	body: {
		type: 'object',
		required: ['username', 'password'],
		properties: {
			username: {
				type: 'string',
				minLength: 1,
			},
			password: {
				type: 'string',
				minLength: 1,
			},
		},
		additionalProperties: false,
	},
};

export const forgotPasswordSchema = {
	body: {
		type: 'object',
		required: ['identifier'],
		properties: {
			identifier: {
				type: 'string',
				minLength: 1,
				description: 'Username or email address',
			},
		},
		additionalProperties: false,
	},
};

export const resetPasswordSchema = {
	body: {
		type: 'object',
		required: ['token', 'password', 'confirmPassword'],
		properties: {
			token: {
				type: 'string',
				minLength: 1,
			},
			password: {
				type: 'string',
				minLength: 8,
			},
			confirmPassword: {
				type: 'string',
				minLength: 1,
			},
		},
		additionalProperties: false,
	},
};
