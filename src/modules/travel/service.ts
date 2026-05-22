import type { FastifyInstance } from 'fastify';
import { AppError } from '../../errors/AppError.js';
import { deleteFromCloudinary } from '../../lib/cloudinary.js';
import { mimeToResourceType } from '../media/schema.js';
import { createTravelRepository } from './repository.js';

function toDto(travel: {
	id: number;
	title: string;
	description: string | null;
	isPublic: boolean;
	cover: {
		id: number;
		url: string;
		mimeType: string;
		size: number;
		takenAt: Date | null;
		lat: number | null;
		lng: number | null;
		place: string | null;
		description: string | null;
		city: string | null;
		region: string | null;
		state: string | null;
		countryCode: string | null;
		travelId: number;
		createdAt: Date;
	} | null;
	authorId: number;
	createdAt: Date;
	updatedAt: Date;
}) {
	return {
		...travel,
		cover: travel.cover
			? {
					...travel.cover,
					takenAt: travel.cover.takenAt?.toISOString() ?? null,
					createdAt: travel.cover.createdAt.toISOString(),
				}
			: null,
		createdAt: travel.createdAt.toISOString(),
		updatedAt: travel.updatedAt.toISOString(),
	};
}

export function createTravelService(fastify: FastifyInstance) {
	const repo = createTravelRepository(fastify.prisma);

	return {
		async getById(id: number) {
			const travel = await repo.findById(id);
			if (!travel) throw new AppError(404, 'Travel not found');
			return toDto(travel);
		},

		async getByAuthor(authorId: number) {
			const travels = await repo.findByAuthor(authorId);
			return travels.map(toDto);
		},

		async create(
			authorId: number,
			data: { title: string; description?: string; isPublic?: boolean },
		) {
			const travel = await repo.create(authorId, data);
			return toDto(travel);
		},

		async update(
			id: number,
			authorId: number,
			data: { title?: string; description?: string; isPublic?: boolean },
		) {
			const existing = await repo.findById(id);
			if (!existing) throw new AppError(404, 'Travel not found');
			if (existing.authorId !== authorId) throw new AppError(403, 'Forbidden');
			const travel = await repo.update(id, data);
			return toDto(travel);
		},

		async delete(id: number, authorId: number) {
			const existing = await repo.findById(id);
			if (!existing) throw new AppError(404, 'Travel not found');
			if (existing.authorId !== authorId) throw new AppError(403, 'Forbidden');
			const medias = await repo.findMediaKeys(id);
			await repo.delete(id);
			await Promise.all(
				medias.map(({ key, mimeType }) =>
					deleteFromCloudinary(key, mimeToResourceType(mimeType)).catch(
						() => null,
					),
				),
			);
			return { message: 'Travel deleted successfully' };
		},
	};
}
