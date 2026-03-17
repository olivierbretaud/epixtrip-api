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
	const baseUrl = process.env.POSTGRES_PRISMA_URL ?? '';
	const url = new URL(baseUrl);
	url.searchParams.set('sslmode', 'verify-full');

	const adapter = new PrismaPg({
		connectionString: url.toString(),
		ssl: {
			rejectUnauthorized: true,
		},
	});
	const prisma = new PrismaClient({ adapter });

	await prisma.$connect();
	server.log.info('Database connected');

	server.decorate('prisma', prisma);

	server.addHook('onClose', async (instance) => {
		await instance.prisma.$disconnect();
	});
});

export default prismaPlugin;
