import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		env: {
			DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
			JWT_SECRET: 'test-secret-minimum-32-characters-long',
			NODE_ENV: 'test',
			PORT: '3001',
			HOST: '0.0.0.0',
		},
	},
});
