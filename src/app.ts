import type { IncomingMessage, ServerResponse } from 'node:http';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { Prisma } from '@prisma/client';
import Fastify, { type FastifyError } from 'fastify';
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
} from 'fastify-type-provider-zod';

import { AppError } from './errors/AppError.js';
import jwtPlugin from './plugins/jwt.js';
import mailerPlugin from './plugins/mailer.js';
import prismaPlugin from './plugins/prisma.js';
import routes from './routes/index.js';

export function buildApp() {
	const app = Fastify({
		logger: {
			transport:
				process.env.NODE_ENV === 'development'
					? { target: 'pino-pretty' }
					: undefined,
		},
	});

	app.setValidatorCompiler(validatorCompiler);
	app.setSerializerCompiler(serializerCompiler);

	app.register(swagger, {
		openapi: {
			info: {
				title: 'Epixtrip API',
				description: 'API documentation',
				version: '1.0.0',
			},
			components: {
				securitySchemes: {
					bearerAuth: {
						type: 'http',
						scheme: 'bearer',
						bearerFormat: 'JWT',
					},
				},
			},
		},
		transform: jsonSchemaTransform,
	});

	app.register(swaggerUi, {
		routePrefix: '/docs',
	});

	app.setErrorHandler((error: FastifyError, _request, reply) => {
		if (error.validation) {
			return reply.status(400).send({
				statusCode: 400,
				message: 'Validation failed',
				errors: (
					error.validation as { instancePath: string; message?: string }[]
				).map((v) => ({
					field: v.instancePath.replace(/^\//, ''),
					message: v.message,
				})),
			});
		}

		if (error instanceof AppError) {
			return reply.status(error.statusCode).send({ message: error.message });
		}

		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === 'P2002') {
				return reply.status(409).send({ message: 'Resource already exists' });
			}
			if (error.code === 'P2025') {
				return reply.status(404).send({ message: 'Resource not found' });
			}
		}

		if (error.statusCode) {
			return reply.status(error.statusCode).send({ message: error.message });
		}

		app.log.error(error);
		return reply.status(500).send({ message: 'Internal server error' });
	});

	app.register(import('@fastify/helmet'));
	app.register(import('@fastify/rate-limit'), {
		max: 100,
		timeWindow: '1 minute',
	});
	app.register(import('@fastify/cors'), {
		origin: process.env.CORS_ORIGIN ?? '*',
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Authorization', 'Content-Type'],
	});
	app.register(sensible);
	app.register(prismaPlugin);
	app.register(mailerPlugin);
	app.register(jwtPlugin);
	app.register(routes, { prefix: '/api' });

	return app;
}

// Vercel serverless handler
const _app = buildApp();
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
	await _app.ready();
	_app.server.emit('request', req, res);
}
