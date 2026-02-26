import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import authRoutes from '../modules/auth/route.js';

const routes: FastifyPluginAsync = async (server) => {
	server.withTypeProvider<ZodTypeProvider>().get('/health', {
		schema: {
			tags: ['Health'],
			summary: 'Health check',
			description: 'Returns the current status of the API.',
			response: {
				200: z.object({ status: z.string() }),
			},
		},
	}, async () => {
		return { status: 'ok' };
	});

	server.register(authRoutes, { prefix: '/auth' });
};

export default routes;
