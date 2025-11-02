export const registerSchema = {
	body: {
		type: 'object',
		required: ['username', 'password', 'confirmPassword'],
		properties: {
			username: {
				type: 'string',
				minLength: 3,
				maxLength: 20,
				pattern: '^[a-zA-Z0-9_-]+$',
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
