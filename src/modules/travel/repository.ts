import type { PrismaClient } from '@prisma/client';

const travelSelect = {
	id: true,
	title: true,
	description: true,
	isPublic: true,
	authorId: true,
	createdAt: true,
	updatedAt: true,
} as const;

export function createTravelRepository(prisma: PrismaClient) {
	return {
		async findById(id: number) {
			return prisma.travel.findUnique({ where: { id }, select: travelSelect });
		},

		async findByAuthor(authorId: number) {
			return prisma.travel.findMany({
				where: { authorId },
				select: travelSelect,
				orderBy: { createdAt: 'desc' },
			});
		},

		async create(
			authorId: number,
			data: { title: string; description?: string; isPublic?: boolean },
		) {
			return prisma.travel.create({
				data: { ...data, authorId },
				select: travelSelect,
			});
		},

		async update(
			id: number,
			data: { title?: string; description?: string; isPublic?: boolean },
		) {
			return prisma.travel.update({
				where: { id },
				data,
				select: travelSelect,
			});
		},

		async delete(id: number) {
			return prisma.travel.delete({ where: { id } });
		},
	};
}
