import type { PrismaClient } from '@prisma/client';
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import {
	serializerCompiler,
	validatorCompiler,
} from 'fastify-type-provider-zod';
import { vi } from 'vitest';
import authRoutes from '../../src/modules/auth/route.js';
import jwtPlugin from '../../src/plugins/jwt.js';

export function buildTestApp(prismaMock: Partial<PrismaClient>) {
	const app = Fastify({ logger: false });

	app.setValidatorCompiler(validatorCompiler);
	app.setSerializerCompiler(serializerCompiler);

	// Inject mock prisma at root scope (fp ensures it propagates to child plugins)
	app.register(
		fp(async (instance) => {
			instance.decorate('prisma', prismaMock as PrismaClient);
			instance.decorate('mailer', {
				send: vi.fn().mockResolvedValue(undefined),
			});
		}),
	);

	app.register(jwtPlugin);
	app.register(authRoutes, { prefix: '/api/auth' });

	return app;
}
