import type { FastifyPluginAsync } from 'fastify';
import authRoutes from '../modules/auth/route.js';

const routes: FastifyPluginAsync = async (server) => {
	server.get('/health', async (_request, _reply) => {
		return { status: 'ok' };
	});

	server.register(authRoutes, { prefix: '/auth' });
};

export default routes;
