import jwt from '@fastify/jwt';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../config/env.js';

declare module '@fastify/jwt' {
	interface FastifyJWT {
		payload: { userId: number; email: string; role: string };
		user: { userId: number; email: string; role: string };
	}
}

declare module 'fastify' {
	interface FastifyInstance {
		authenticate: (
			request: FastifyRequest,
			reply: FastifyReply,
		) => Promise<void>;
	}
}

const jwtPlugin: FastifyPluginAsync = fp(async (fastify) => {
	await fastify.register(jwt, { secret: env.JWT_SECRET });

	fastify.decorate(
		'authenticate',
		async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				await request.jwtVerify();
			} catch (err) {
				reply.send(err);
			}
		},
	);
});

export default jwtPlugin;
