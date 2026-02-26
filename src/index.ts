import 'dotenv/config';
import { buildApp } from './app.js';
import { env } from './config/env.js';

const app = buildApp();

const start = async (): Promise<void> => {
	try {
		await app.listen({ port: env.PORT, host: env.HOST });
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

const shutdown = async (): Promise<void> => {
	try {
		await app.close();
		process.exit(0);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
