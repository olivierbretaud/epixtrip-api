import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { MediaRow } from './repository.js';
import {
	mediaListResponse,
	mediaParams,
	mediaResponse,
	updateMediaBody,
} from './schema.js';
import { createMediaService } from './service.js';

function toMediaDto(m: MediaRow) {
	return {
		id: m.id,
		url: m.url,
		mimeType: m.mimeType,
		size: m.size,
		takenAt: m.takenAt instanceof Date ? m.takenAt.toISOString() : (m.takenAt ?? null),
		lat: m.lat != null && Number.isFinite(m.lat) ? m.lat : null,
		lng: m.lng != null && Number.isFinite(m.lng) ? m.lng : null,
		place: m.place ?? null,
		description: m.description ?? null,
		city: m.city ?? null,
		region: m.region ?? null,
		state: m.state ?? null,
		countryCode: m.countryCode ?? null,
		travelId: m.travelId,
		createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
	};
}

const mediaRoutes: FastifyPluginAsync = async (fastify) => {
	const mediaService = createMediaService(fastify);

	fastify.withTypeProvider<ZodTypeProvider>().get(
		'/:travelId/media',
		{
			schema: {
				tags: ['Media'],
				summary: 'List media for a travel',
				description: 'Returns all media files attached to a travel.',
				params: mediaParams,
				response: {
					200: mediaListResponse,
					404: z.object({ message: z.string() }),
				},
			},
		},
		async (request) => {
			const medias = await mediaService.getByTravel(request.params.travelId);
			return medias.map(toMediaDto);
		},
	);

	fastify.post(
		'/:travelId/media',
		{
			schema: {
				tags: ['Media'],
				summary: 'Upload media files to a travel',
				description:
					'Uploads one or more image/video files (JPEG, PNG, WebP, MP4, WebM). Max 10 MB per file. Requires authentication.',
				security: [{ bearerAuth: [] }],
				consumes: ['multipart/form-data'],
				body: {
					type: 'object',
					properties: {
						files: {
							type: 'array',
							items: { type: 'string', format: 'binary' },
							description: 'One or more media files to upload',
						},
					},
				},

				response: {
					201: mediaListResponse,
					400: z.object({ message: z.string() }),
					401: z.object({ message: z.string() }),
					413: z.object({ message: z.string() }),
					422: z.object({ message: z.string() }),
				},
			},
			// @fastify/multipart handles body parsing — skip Zod body validation
			validatorCompiler: () => () => true,
			preHandler: [fastify.authenticate],
		},
		async (request, reply) => {
			const travelId = Number(
				(request.params as { travelId: string }).travelId,
			);
			if (!Number.isInteger(travelId) || travelId <= 0) {
				return reply.status(400).send({ message: 'Invalid travelId' });
			}

			const files = request.files();
			const created = await mediaService.uploadMany(travelId, files);

			return reply.code(201).send(created.map(toMediaDto));
		},
	);

	fastify.withTypeProvider<ZodTypeProvider>().patch(
		'/:travelId/media/:mediaId',
		{
			schema: {
				tags: ['Media'],
				summary: 'Update media metadata',
				description:
					'Updates place and/or description of a media file. Requires authentication.',
				security: [{ bearerAuth: [] }],
				params: mediaParams.extend({
					mediaId: z.coerce.number().int().positive(),
				}),
				body: updateMediaBody,
				response: {
					200: mediaResponse,
					401: z.object({ message: z.string() }),
					404: z.object({ message: z.string() }),
				},
			},
			preHandler: [fastify.authenticate],
		},
		async (request) => {
			const media = await mediaService.updateOne(
				request.params.mediaId,
				request.body,
			);
			return toMediaDto(media);
		},
	);

	fastify.withTypeProvider<ZodTypeProvider>().delete(
		'/:travelId/media/:mediaId',
		{
			schema: {
				tags: ['Media'],
				summary: 'Delete a media file',
				description:
					'Deletes a media file from a travel. Requires authentication.',
				security: [{ bearerAuth: [] }],
				params: mediaParams.extend({
					mediaId: z.coerce.number().int().positive(),
				}),
				response: {
					200: mediaResponse,
					401: z.object({ message: z.string() }),
					404: z.object({ message: z.string() }),
				},
			},
			preHandler: [fastify.authenticate],
		},
		async (request) => {
			const media = await mediaService.deleteOne(request.params.mediaId);
			return toMediaDto(media);
		},
	);
};

export default mediaRoutes;
