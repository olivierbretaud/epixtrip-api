import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import Fastify, { type FastifyError } from 'fastify';
import fp from 'fastify-plugin';
import {
	serializerCompiler,
	validatorCompiler,
} from 'fastify-type-provider-zod';
import { vi } from 'vitest';
import { AppError } from '../../src/errors/AppError.js';
import authRoutes from '../../src/modules/auth/route.js';
import mediaRoutes from '../../src/modules/media/route.js';
import travelRoutes from '../../src/modules/travel/route.js';
import jwtPlugin from '../../src/plugins/jwt.js';

export function buildTestApp(prismaMock: Partial<PrismaClient>) {
	const app = Fastify({ logger: false });

	app.setValidatorCompiler(validatorCompiler);
	app.setSerializerCompiler(serializerCompiler);

	app.register(
		fp(async (instance) => {
			instance.decorate('prisma', prismaMock as PrismaClient);
			instance.decorate('mailer', {
				send: vi.fn().mockResolvedValue(undefined),
			});
		}),
	);

	app.setErrorHandler((error: FastifyError, _request, reply) => {
		if (error instanceof AppError) {
			return reply.status(error.statusCode).send({ message: error.message });
		}
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === 'P2025') {
				return reply.status(404).send({ message: 'Resource not found' });
			}
			if (error.code === 'P2002') {
				return reply.status(409).send({ message: 'Resource already exists' });
			}
		}
		if (error.statusCode) {
			return reply.status(error.statusCode).send({ message: error.message });
		}
		return reply.status(500).send({ message: 'Internal server error' });
	});

	app.register(import('@fastify/multipart'), {
		limits: { fileSize: 50 * 1024 * 1024, files: 20 },
	});
	app.register(jwtPlugin);
	app.register(authRoutes, { prefix: '/api/auth' });
	app.register(travelRoutes, { prefix: '/api/travel' });
	app.register(mediaRoutes, { prefix: '/api/travel' });

	return app;
}
