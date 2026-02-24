import type { FastifyPluginAsync } from 'fastify';

const routes: FastifyPluginAsync = async (server) => {
	server.get('/health', async (_request, _reply) => {
		return { status: 'ok' };
	});
};

export default routes;
