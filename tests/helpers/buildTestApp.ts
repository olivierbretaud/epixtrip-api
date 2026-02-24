import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import fp from 'fastify-plugin';
import type { PrismaClient } from '@prisma/client';
import jwtPlugin from '../../src/plugins/jwt.js';
import authRoutes from '../../src/modules/auth/route.js';

export function buildTestApp(prismaMock: Partial<PrismaClient>) {
	const app = Fastify({ logger: false });

	app.setValidatorCompiler(validatorCompiler);
	app.setSerializerCompiler(serializerCompiler);

	// Inject mock prisma at root scope (fp ensures it propagates to child plugins)
	app.register(
		fp(async (instance) => {
			instance.decorate('prisma', prismaMock as PrismaClient);
		}),
	);

	app.register(jwtPlugin);
	app.register(authRoutes, { prefix: '/api/auth' });

	return app;
}
