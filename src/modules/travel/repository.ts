import type { PrismaClient } from '@prisma/client';

const travelSelect = {
	id: true,
	title: true,
	description: true,
	isPublic: true,
	cover: {
		select: {
			id: true,
			url: true,
			mimeType: true,
			size: true,
			takenAt: true,
			lat: true,
			lng: true,
			place: true,
			description: true,
			city: true,
			region: true,
			state: true,
			countryCode: true,
			travelId: true,
			createdAt: true,
		},
	},
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

		async setCoverIfEmpty(travelId: number, mediaId: number): Promise<void> {
			await prisma.travel.updateMany({
				where: { id: travelId, coverId: null },
				data: { coverId: mediaId },
			});
		},

		async setCover(travelId: number, mediaId: number): Promise<void> {
			await prisma.travel.update({
				where: { id: travelId },
				data: { coverId: mediaId },
			});
		},

		async findMediaKeys(
			travelId: number,
		): Promise<{ key: string; mimeType: string }[]> {
			return prisma.media.findMany({
				where: { travelId },
				select: { key: true, mimeType: true },
			});
		},

		async delete(id: number) {
			return prisma.travel.delete({ where: { id } });
		},
	};
}
