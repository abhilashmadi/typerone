import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		// Run setup-env.js FIRST to set environment variables before any imports
		setupFiles: ['./tests/setup-env.js', './tests/setup.js'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/**', 'tests/**', '**/*.config.js', 'server.js'],
		},
		testTimeout: 30000,
		hookTimeout: 30000,
	},
});
