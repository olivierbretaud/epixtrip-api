import type { FastifyInstance } from 'fastify';

export type MediaRow = {
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
};

type CreateMediaInput = {
	url: string;
	key: string;
	mimeType: string;
	size: number;
	takenAt?: Date | null;
	lat?: number | null;
	lng?: number | null;
	city?: string | null;
	region?: string | null;
	state?: string | null;
	countryCode?: string | null;
	travelId: number;
};

const mediaSelect = {
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
} as const;

export function createMediaRepository(fastify: FastifyInstance) {
	return {
		async createMany(medias: CreateMediaInput[]): Promise<MediaRow[]> {
			return fastify.prisma.$transaction(
				medias.map((media) =>
					fastify.prisma.media.create({ data: media, select: mediaSelect }),
				),
			) as Promise<MediaRow[]>;
		},

		async findByTravel(travelId: number): Promise<MediaRow[]> {
			return fastify.prisma.media.findMany({
				where: { travelId, lat: { not: null }, lng: { not: null } },
				select: mediaSelect,
				orderBy: [
					{ takenAt: { sort: 'asc', nulls: 'last' } },
					{ createdAt: 'asc' },
				],
			}) as Promise<MediaRow[]>;
		},

		async findById(id: number): Promise<MediaRow | null> {
			return fastify.prisma.media.findUnique({
				where: { id },
				select: mediaSelect,
			}) as Promise<MediaRow | null>;
		},

		async updateOne(
			id: number,
			data: { place?: string | null; description?: string | null },
		): Promise<MediaRow> {
			return fastify.prisma.media.update({
				where: { id },
				data,
				select: mediaSelect,
			}) as Promise<MediaRow>;
		},

		async isCover(id: number): Promise<boolean> {
			const count = await fastify.prisma.travel.count({
				where: { coverId: id },
			});
			return count > 0;
		},

		async findFirstImageByTravel(
			travelId: number,
		): Promise<{ id: number } | null> {
			return fastify.prisma.media.findFirst({
				where: { travelId, mimeType: { startsWith: 'image/' } },
				select: { id: true },
				orderBy: { createdAt: 'asc' },
			});
		},

		async deleteOne(id: number): Promise<MediaRow & { key: string }> {
			return fastify.prisma.media.delete({
				where: { id },
				select: { ...mediaSelect, key: true },
			}) as Promise<MediaRow & { key: string }>;
		},
	};
}
