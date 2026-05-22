import { Prisma } from '@prisma/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTestApp } from '../helpers/buildTestApp.js';

vi.mock('../../src/lib/cloudinary.js', () => ({
	deleteFromCloudinary: vi.fn().mockResolvedValue(undefined),
	uploadToCloudinary: vi.fn().mockResolvedValue('https://res.cloudinary.com/test/image.jpg'),
}));

const mockMedia = {
	id: 1,
	url: 'https://res.cloudinary.com/test/image.jpg',
	key: 'epixtrip/test/1/uuid',
	mimeType: 'image/jpeg',
	size: 760678,
	takenAt: new Date('2025-09-10T05:28:24.000Z'),
	lat: -13.7626,
	lng: -71.2034,
	place: null,
	description: null,
	city: null,
	region: null,
	state: null,
	countryCode: null,
	travelId: 1,
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

function makePrismaMock() {
	return {
		$transaction: vi.fn(),
		media: {
			findMany: vi.fn(),
			findFirst: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		travel: {
			count: vi.fn(),
			update: vi.fn(),
		},
	};
}

function makeToken(app: ReturnType<typeof buildTestApp>, userId = 1) {
	return app.jwt.sign({ userId, email: 'john@example.com', role: 'Member' });
}

// ─── GET /api/travel/:travelId/media ────────────────────────────────────────

describe('GET /api/travel/:travelId/media', () => {
	let app: ReturnType<typeof buildTestApp>;
	let prisma: ReturnType<typeof makePrismaMock>;

	beforeEach(() => {
		prisma = makePrismaMock();
		app = buildTestApp(prisma as never);
	});

	afterEach(async () => {
		await app.close();
		vi.clearAllMocks();
	});

	it('returns 200 with serialized media list', async () => {
		prisma.media.findMany.mockResolvedValue([mockMedia]);

		await app.ready();

		const res = await app.inject({
			method: 'GET',
			url: '/api/travel/1/media',
		});

		expect(res.statusCode).toBe(200);
		const body = res.json<typeof mockMedia[]>();
		expect(body).toHaveLength(1);
		expect(body[0].id).toBe(1);
		expect(body[0].lat).toBe(-13.7626);
		expect(body[0].takenAt).toBe('2025-09-10T05:28:24.000Z');
		expect(body[0].createdAt).toBe('2026-01-01T00:00:00.000Z');
	});

	it('returns 200 with empty list when travel has no media', async () => {
		prisma.media.findMany.mockResolvedValue([]);

		await app.ready();

		const res = await app.inject({
			method: 'GET',
			url: '/api/travel/1/media',
		});

		expect(res.statusCode).toBe(200);
		expect(res.json()).toEqual([]);
	});

	it('returns 400 for invalid travelId', async () => {
		await app.ready();

		const res = await app.inject({
			method: 'GET',
			url: '/api/travel/abc/media',
		});

		expect(res.statusCode).toBe(400);
	});
});

// ─── POST /api/travel/:travelId/media ───────────────────────────────────────

describe('POST /api/travel/:travelId/media', () => {
	let app: ReturnType<typeof buildTestApp>;
	let prisma: ReturnType<typeof makePrismaMock>;

	beforeEach(() => {
		prisma = makePrismaMock();
		app = buildTestApp(prisma as never);
	});

	afterEach(async () => {
		await app.close();
		vi.clearAllMocks();
	});

	it('returns 401 without token', async () => {
		await app.ready();

		const res = await app.inject({
			method: 'POST',
			url: '/api/travel/1/media',
		});

		expect(res.statusCode).toBe(401);
	});
});

// ─── PATCH /api/travel/:travelId/media/:mediaId ──────────────────────────────

describe('PATCH /api/travel/:travelId/media/:mediaId', () => {
	let app: ReturnType<typeof buildTestApp>;
	let prisma: ReturnType<typeof makePrismaMock>;

	beforeEach(() => {
		prisma = makePrismaMock();
		app = buildTestApp(prisma as never);
	});

	afterEach(async () => {
		await app.close();
		vi.clearAllMocks();
	});

	it('returns 200 with updated media', async () => {
		const updated = { ...mockMedia, place: 'Machu Picchu', description: 'Vue incroyable' };
		prisma.media.update.mockResolvedValue(updated);

		await app.ready();
		const token = makeToken(app);

		const res = await app.inject({
			method: 'PATCH',
			url: '/api/travel/1/media/1',
			headers: { authorization: `Bearer ${token}` },
			payload: { place: 'Machu Picchu', description: 'Vue incroyable' },
		});

		expect(res.statusCode).toBe(200);
		const body = res.json();
		expect(body.place).toBe('Machu Picchu');
		expect(body.description).toBe('Vue incroyable');
	});

	it('returns 200 with null clears the field', async () => {
		const updated = { ...mockMedia, place: null };
		prisma.media.update.mockResolvedValue(updated);

		await app.ready();
		const token = makeToken(app);

		const res = await app.inject({
			method: 'PATCH',
			url: '/api/travel/1/media/1',
			headers: { authorization: `Bearer ${token}` },
			payload: { place: null },
		});

		expect(res.statusCode).toBe(200);
		expect(res.json().place).toBeNull();
	});

	it('returns 401 without token', async () => {
		await app.ready();

		const res = await app.inject({
			method: 'PATCH',
			url: '/api/travel/1/media/1',
			payload: { place: 'Paris' },
		});

		expect(res.statusCode).toBe(401);
	});

	it('returns 404 when media does not exist', async () => {
		prisma.media.update.mockRejectedValue(
			new Prisma.PrismaClientKnownRequestError('Not found', {
				code: 'P2025',
				clientVersion: '7.0.0',
			}),
		);

		await app.ready();
		const token = makeToken(app);

		const res = await app.inject({
			method: 'PATCH',
			url: '/api/travel/1/media/99',
			headers: { authorization: `Bearer ${token}` },
			payload: { place: 'Paris' },
		});

		expect(res.statusCode).toBe(404);
	});
});

// ─── DELETE /api/travel/:travelId/media/:mediaId ─────────────────────────────

describe('DELETE /api/travel/:travelId/media/:mediaId', () => {
	let app: ReturnType<typeof buildTestApp>;
	let prisma: ReturnType<typeof makePrismaMock>;

	beforeEach(() => {
		prisma = makePrismaMock();
		app = buildTestApp(prisma as never);
	});

	afterEach(async () => {
		await app.close();
		vi.clearAllMocks();
	});

	it('returns 200 and calls Cloudinary delete', async () => {
		prisma.travel.count.mockResolvedValue(0);
		prisma.media.delete.mockResolvedValue(mockMedia);

		await app.ready();
		const token = makeToken(app);

		const { deleteFromCloudinary } = await import('../../src/lib/cloudinary.js');

		const res = await app.inject({
			method: 'DELETE',
			url: '/api/travel/1/media/1',
			headers: { authorization: `Bearer ${token}` },
		});

		expect(res.statusCode).toBe(200);
		expect(res.json().id).toBe(1);
		expect(deleteFromCloudinary).toHaveBeenCalledWith(mockMedia.key, 'image');
	});

	it('returns 401 without token', async () => {
		await app.ready();

		const res = await app.inject({
			method: 'DELETE',
			url: '/api/travel/1/media/1',
		});

		expect(res.statusCode).toBe(401);
	});

	it('returns 404 when media does not exist', async () => {
		prisma.travel.count.mockResolvedValue(0);
		prisma.media.delete.mockRejectedValue(
			new Prisma.PrismaClientKnownRequestError('Not found', {
				code: 'P2025',
				clientVersion: '7.0.0',
			}),
		);

		await app.ready();
		const token = makeToken(app);

		const res = await app.inject({
			method: 'DELETE',
			url: '/api/travel/1/media/99',
			headers: { authorization: `Bearer ${token}` },
		});

		expect(res.statusCode).toBe(404);
	});

	it('returns 400 for invalid mediaId', async () => {
		await app.ready();
		const token = makeToken(app);

		const res = await app.inject({
			method: 'DELETE',
			url: '/api/travel/1/media/abc',
			headers: { authorization: `Bearer ${token}` },
		});

		expect(res.statusCode).toBe(400);
	});
});
