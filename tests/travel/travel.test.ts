import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTestApp } from '../helpers/buildTestApp.js';

const mockTravel = {
	id: 1,
	title: 'My Trip to Paris',
	description: 'A wonderful trip',
	isPublic: false,
	authorId: 1,
	createdAt: new Date('2024-01-01T00:00:00.000Z'),
	updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

function makePrismaMock() {
	return {
		user: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
		travel: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
	};
}

function makeToken(app: ReturnType<typeof buildTestApp>, userId = 1) {
	return app.jwt.sign({ userId, email: 'john@example.com', role: 'Member' });
}

// ─── GET /api/travels ────────────────────────────────────────────────────────

describe('GET /api/travels', () => {
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

	it('returns 200 with the authenticated user travels', async () => {
		prisma.travel.findMany.mockResolvedValue([mockTravel]);

		await app.ready();
		const token = makeToken(app);

		const res = await app.inject({
			method: 'GET',
			url: '/api/travels',
			headers: { authorization: `Bearer ${token}` },
		});

		expect(res.statusCode).toBe(200);
		const body = res.json<typeof mockTravel[]>();
		expect(body).toHaveLength(1);
		expect(body[0].title).toBe('My Trip to Paris');
		expect(typeof body[0].createdAt).toBe('string');
	});

	it('returns empty array when user has no travels', async () => {
		prisma.travel.findMany.mockResolvedValue([]);

		await app.ready();
		const token = makeToken(app);

		const res = await app.inject({
			method: 'GET',
			url: '/api/travels',
			headers: { authorization: `Bearer ${token}` },
		});

		expect(res.statusCode).toBe(200);
		expect(res.json()).toEqual([]);
	});

	it('returns 401 without token', async () => {
		const res = await app.inject({ method: 'GET', url: '/api/travels' });
		expect(res.statusCode).toBe(401);
	});
});

// ─── GET /api/travels/:id ─────────────────────────────────────────────────────

describe('GET /api/travels/:id', () => {
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

	it('returns 200 with the travel', async () => {
		prisma.travel.findUnique.mockResolvedValue(mockTravel);

		const res = await app.inject({ method: 'GET', url: '/api/travels/1' });

		expect(res.statusCode).toBe(200);
		const body = res.json<typeof mockTravel>();
		expect(body.id).toBe(1);
		expect(body.title).toBe('My Trip to Paris');
		expect(body.isPublic).toBe(false);
	});

	it('returns 404 when travel does not exist', async () => {
		prisma.travel.findUnique.mockResolvedValue(null);

		const res = await app.inject({ method: 'GET', url: '/api/travels/99' });

		expect(res.statusCode).toBe(404);
		expect(res.json<{ message: string }>().message).toBe('Travel not found');
	});

	it('returns 400 on non-numeric id', async () => {
		const res = await app.inject({ method: 'GET', url: '/api/travels/abc' });
		expect(res.statusCode).toBe(400);
	});
});

// ─── POST /api/travels ───────────────────────────────────────────────────────

describe('POST /api/travels', () => {
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

	it('returns 201 with created travel', async () => {
		prisma.travel.create.mockResolvedValue(mockTravel);

		await app.ready();
		const token = makeToken(app);

		const res = await app.inject({
			method: 'POST',
			url: '/api/travels',
			headers: { authorization: `Bearer ${token}` },
			payload: { title: 'My Trip to Paris', description: 'A wonderful trip' },
		});

		expect(res.statusCode).toBe(201);
		const body = res.json<typeof mockTravel>();
		expect(body.title).toBe('My Trip to Paris');
		expect(body.authorId).toBe(1);
	});

	it('returns 201 without description (optional)', async () => {
		prisma.travel.create.mockResolvedValue({ ...mockTravel, description: null });

		await app.ready();
		const token = makeToken(app);

		const res = await app.inject({
			method: 'POST',
			url: '/api/travels',
			headers: { authorization: `Bearer ${token}` },
			payload: { title: 'Quick Trip' },
		});

		expect(res.statusCode).toBe(201);
		expect(res.json<{ description: null }>().description).toBeNull();
	});

	it('returns 201 with isPublic true when specified', async () => {
		prisma.travel.create.mockResolvedValue({ ...mockTravel, isPublic: true });

		await app.ready();
		const token = makeToken(app);

		const res = await app.inject({
			method: 'POST',
			url: '/api/travels',
			headers: { authorization: `Bearer ${token}` },
			payload: { title: 'Public Trip', isPublic: true },
		});

		expect(res.statusCode).toBe(201);
		expect(res.json<{ isPublic: boolean }>().isPublic).toBe(true);
	});

	it('returns 400 when title is missing', async () => {
		await app.ready();
		const token = makeToken(app);

		const res = await app.inject({
			method: 'POST',
			url: '/api/travels',
			headers: { authorization: `Bearer ${token}` },
			payload: { description: 'No title here' },
		});

		expect(res.statusCode).toBe(400);
	});

	it('returns 401 without token', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/api/travels',
			payload: { title: 'My Trip' },
		});

		expect(res.statusCode).toBe(401);
	});
});

// ─── PUT /api/travels/:id ─────────────────────────────────────────────────────

describe('PUT /api/travels/:id', () => {
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

	it('returns 200 with updated travel', async () => {
		const updated = { ...mockTravel, title: 'Updated Title' };
		prisma.travel.findUnique.mockResolvedValue(mockTravel);
		prisma.travel.update.mockResolvedValue(updated);

		await app.ready();
		const token = makeToken(app);

		const res = await app.inject({
			method: 'PUT',
			url: '/api/travels/1',
			headers: { authorization: `Bearer ${token}` },
			payload: { title: 'Updated Title' },
		});

		expect(res.statusCode).toBe(200);
		expect(res.json<{ title: string }>().title).toBe('Updated Title');
	});

	it('returns 403 when user is not the author', async () => {
		prisma.travel.findUnique.mockResolvedValue({ ...mockTravel, authorId: 99 });

		await app.ready();
		const token = makeToken(app, 1);

		const res = await app.inject({
			method: 'PUT',
			url: '/api/travels/1',
			headers: { authorization: `Bearer ${token}` },
			payload: { title: 'Hijack' },
		});

		expect(res.statusCode).toBe(403);
	});

	it('returns 404 when travel does not exist', async () => {
		prisma.travel.findUnique.mockResolvedValue(null);

		await app.ready();
		const token = makeToken(app);

		const res = await app.inject({
			method: 'PUT',
			url: '/api/travels/99',
			headers: { authorization: `Bearer ${token}` },
			payload: { title: 'Ghost' },
		});

		expect(res.statusCode).toBe(404);
	});

	it('returns 401 without token', async () => {
		const res = await app.inject({
			method: 'PUT',
			url: '/api/travels/1',
			payload: { title: 'No auth' },
		});

		expect(res.statusCode).toBe(401);
	});
});

// ─── DELETE /api/travels/:id ──────────────────────────────────────────────────

describe('DELETE /api/travels/:id', () => {
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

	it('returns 200 on successful deletion', async () => {
		prisma.travel.findUnique.mockResolvedValue(mockTravel);
		prisma.travel.delete.mockResolvedValue(mockTravel);

		await app.ready();
		const token = makeToken(app);

		const res = await app.inject({
			method: 'DELETE',
			url: '/api/travels/1',
			headers: { authorization: `Bearer ${token}` },
		});

		expect(res.statusCode).toBe(200);
		expect(res.json<{ message: string }>().message).toBe(
			'Travel deleted successfully',
		);
	});

	it('returns 403 when user is not the author', async () => {
		prisma.travel.findUnique.mockResolvedValue({ ...mockTravel, authorId: 99 });

		await app.ready();
		const token = makeToken(app, 1);

		const res = await app.inject({
			method: 'DELETE',
			url: '/api/travels/1',
			headers: { authorization: `Bearer ${token}` },
		});

		expect(res.statusCode).toBe(403);
	});

	it('returns 404 when travel does not exist', async () => {
		prisma.travel.findUnique.mockResolvedValue(null);

		await app.ready();
		const token = makeToken(app);

		const res = await app.inject({
			method: 'DELETE',
			url: '/api/travels/99',
			headers: { authorization: `Bearer ${token}` },
		});

		expect(res.statusCode).toBe(404);
	});

	it('returns 401 without token', async () => {
		const res = await app.inject({
			method: 'DELETE',
			url: '/api/travels/1',
		});

		expect(res.statusCode).toBe(401);
	});
});
