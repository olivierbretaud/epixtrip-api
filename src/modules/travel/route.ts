import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
	createTravelBody,
	travelListResponse,
	travelParams,
	travelResponse,
	updateTravelBody,
} from './schema.js';
import { createTravelService } from './service.js';

const travelRoutes: FastifyPluginAsync = async (fastify) => {
	const travelService = createTravelService(fastify);

	fastify.withTypeProvider<ZodTypeProvider>().get(
		'/',
		{
			schema: {
				tags: ['Travels'],
				summary: 'List my travels',
				description: 'Returns all travels created by the authenticated user.',
				security: [{ bearerAuth: [] }],
				response: {
					200: travelListResponse,
					401: z.object({ message: z.string() }),
				},
			},
			preHandler: [fastify.authenticate],
		},
		async (request) => {
			return travelService.getByAuthor(request.user.userId);
		},
	);

	fastify.withTypeProvider<ZodTypeProvider>().get(
		'/:id',
		{
			schema: {
				tags: ['Travels'],
				summary: 'Get a travel',
				description: 'Returns a single travel by its ID.',
				params: travelParams,
				response: {
					200: travelResponse,
					404: z.object({ message: z.string() }),
				},
			},
		},
		async (request) => {
			return travelService.getById(request.params.id);
		},
	);

	fastify.withTypeProvider<ZodTypeProvider>().post(
		'/',
		{
			schema: {
				tags: ['Travels'],
				summary: 'Create a travel',
				description: 'Creates a new travel for the authenticated user.',
				security: [{ bearerAuth: [] }],
				body: createTravelBody,
				response: {
					201: travelResponse,
					401: z.object({ message: z.string() }),
				},
			},
			preHandler: [fastify.authenticate],
		},
		async (request, reply) => {
			const travel = await travelService.create(
				request.user.userId,
				request.body,
			);
			return reply.code(201).send(travel);
		},
	);

	fastify.withTypeProvider<ZodTypeProvider>().put(
		'/:id',
		{
			schema: {
				tags: ['Travels'],
				summary: 'Update a travel',
				description: 'Updates an existing travel. Only the author can edit it.',
				security: [{ bearerAuth: [] }],
				params: travelParams,
				body: updateTravelBody,
				response: {
					200: travelResponse,
					401: z.object({ message: z.string() }),
					403: z.object({ message: z.string() }),
					404: z.object({ message: z.string() }),
				},
			},
			preHandler: [fastify.authenticate],
		},
		async (request) => {
			return travelService.update(
				request.params.id,
				request.user.userId,
				request.body,
			);
		},
	);

	fastify.withTypeProvider<ZodTypeProvider>().delete(
		'/:id',
		{
			schema: {
				tags: ['Travels'],
				summary: 'Delete a travel',
				description: 'Deletes a travel. Only the author can delete it.',
				security: [{ bearerAuth: [] }],
				params: travelParams,
				response: {
					200: z.object({ message: z.string() }),
					401: z.object({ message: z.string() }),
					403: z.object({ message: z.string() }),
					404: z.object({ message: z.string() }),
				},
			},
			preHandler: [fastify.authenticate],
		},
		async (request) => {
			return travelService.delete(request.params.id, request.user.userId);
		},
	);
};

export default travelRoutes;
