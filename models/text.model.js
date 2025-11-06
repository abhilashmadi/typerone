import { getMongoose } from '../configs/mongoose.config.js';

const { Schema, model } = getMongoose();

export const TEXT_SOURCES = {
	BOOK: 'book',
	MOVIE: 'movie',
	CODE: 'code',
	ARTICLE: 'article',
	SONG: 'song',
	CUSTOM: 'custom',
	QUOTE: 'quote',
};

export const TEXT_DIFFICULTY_LEVELS = {
	EASY: 'easy',
	MEDIUM: 'medium',
	HARD: 'hard',
};

export const TEXT_LANGUAGE = {
	ENGLISH: 'en',
};

export const TEXT_TAGS = {
	CODE: 'code',
	TEXT: 'text',
	SYMBOLS: 'symbols',
};

const textSchema = new Schema(
	{
		content: {
			type: String,
			required: true,
			trim: true,
		},
		source: {
			type: String,
			enum: Object.values(TEXT_SOURCES),
			default: TEXT_SOURCES.CUSTOM,
		},
		author: {
			type: String,
			trim: true,
			default: 'system',
		},
		difficulty: {
			type: String,
			enum: Object.values(TEXT_DIFFICULTY_LEVELS),
			default: TEXT_DIFFICULTY_LEVELS.MEDIUM,
			index: true,
		},
		language: {
			type: String,
			default: TEXT_LANGUAGE.ENGLISH,
			index: true,
		},
		tags: {
			type: [String],
			enum: Object.values(TEXT_TAGS),
			default: [],
			index: true,
		},
		length: {
			type: Number,
			required: true,
		},
		popularity: {
			type: Number,
			default: 0,
			min: 0,
		},
	},
	{
		timestamps: true, // Adds createdAt and updatedAt
	},
);

// Compound index for efficient queries
textSchema.index({ difficulty: 1, language: 1 });
textSchema.index({ popularity: -1 });

// Pre-save hook to calculate length if not provided
textSchema.pre('save', function (next) {
	if (!this.length && this.content) {
		this.length = this.content.length;
	}
	next();
});

const Text = model('Text', textSchema);

export default Text;
