import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import authRoutes from '../modules/auth/route.js';
import mediaRoutes from '../modules/media/route.js';
import travelRoutes from '../modules/travel/route.js';

const routes: FastifyPluginAsync = async (server) => {
	server.withTypeProvider<ZodTypeProvider>().get(
		'/',
		{
			schema: {
				tags: ['Health'],
				summary: 'Health check',
				description: 'Returns the current status of the API.',
				response: {
					200: z.object({ status: z.string() }),
				},
			},
		},
		async () => {
			return { status: 'ok' };
		},
	);

	server.register(authRoutes, { prefix: '/auth' });
	server.register(travelRoutes, { prefix: '/travel' });
	server.register(mediaRoutes, { prefix: '/travel' });
};

export default routes;
