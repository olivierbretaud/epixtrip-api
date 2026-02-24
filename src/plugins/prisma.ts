import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
	interface FastifyInstance {
		prisma: PrismaClient;
	}
}

const prismaPlugin: FastifyPluginAsync = fp(async (server) => {
	const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
	const prisma = new PrismaClient({ adapter });

	await prisma.$connect();
	server.log.info('Database connected');

	server.decorate('prisma', prisma);

	server.addHook('onClose', async (instance) => {
		await instance.prisma.$disconnect();
	});
});

export default prismaPlugin;
