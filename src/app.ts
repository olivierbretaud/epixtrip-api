import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import sensible from '@fastify/sensible';
import Fastify from 'fastify';
import {
	serializerCompiler,
	validatorCompiler,
	jsonSchemaTransform,
} from 'fastify-type-provider-zod';
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
		},
		transform: jsonSchemaTransform,
	});

	app.register(swaggerUi, {
		routePrefix: '/docs',
	});

	app.register(sensible);
	app.register(prismaPlugin);
	app.register(routes);

	return app;
}
