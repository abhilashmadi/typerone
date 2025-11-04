import bcrypt from 'bcryptjs';
import { getMongoose } from '../configs/mongoose.config.js';
import { UnauthorizedException } from '../utils/exceptions.utils.js';

const { Schema, model } = getMongoose();

const userSchema = new Schema(
	{
		username: {
			type: String,
			required: [true, 'Username is required'],
			unique: true,
			trim: true,
			minlength: [3, 'Username must be at least 3 characters'],
			maxlength: [20, 'Username must not exceed 20 characters'],
			index: true,
		},
		email: {
			type: String,
			required: [true, 'Email is required'],
			unique: true,
			trim: true,
			lowercase: true,
			match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
			index: true,
		},
		password: {
			type: String,
			required: [true, 'Password is required'],
			minlength: [8, 'Password must be at least 8 characters'],
			select: false,
		},
		sessionToken: {
			type: String,
			default: null,
			select: false,
		},
		avatar: {
			type: String,
			default: null,
		},
		bio: {
			type: String,
			maxlength: [500, 'Bio must not exceed 500 characters'],
			default: '',
		},
		lastLoginAt: {
			type: Date,
			default: null,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		role: {
			type: String,
			enum: ['user', 'admin', 'moderator'],
			default: 'user',
		},
	},
	{
		timestamps: true,
		collection: 'users',
		toObject: {
			virtuals: true,
			transform: (_, ret) => {
				delete ret.password;
				delete ret.sessionToken;
				delete ret._id;
				delete ret.__v;
				return ret;
			},
		},
	},
);

// Indexes
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1 });
userSchema.index({ email: 1 });

userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();

	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

userSchema.methods.comparePassword = async function (candidatePassword) {
	try {
		return await bcrypt.compare(candidatePassword, this.password);
	} catch {
		throw new UnauthorizedException('Credentials comparison failed');
	}
};

userSchema.methods.updateLastLogin = function () {
	this.lastLoginAt = new Date();
	return this.save({ validateBeforeSave: false });
};

const User = model('User', userSchema);

export default User;
