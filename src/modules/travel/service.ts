import type { FastifyInstance } from 'fastify';
import { AppError } from '../../errors/AppError.js';
import { createTravelRepository } from './repository.js';

function toDto(travel: {
	id: number;
	title: string;
	description: string | null;
	isPublic: boolean;
	authorId: number;
	createdAt: Date;
	updatedAt: Date;
}) {
	return {
		...travel,
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
			await repo.delete(id);
			return { message: 'Travel deleted successfully' };
		},
	};
}
