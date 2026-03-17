import bcrypt from 'bcryptjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTestApp } from '../helpers/buildTestApp.js';

const VALID_PASSWORD = 'Password#123!';
const HASHED_PASSWORD = await bcrypt.hash(VALID_PASSWORD, 10);

const mockUser = {
	id: 1,
	email: 'john@example.com',
	password: HASHED_PASSWORD,
	firstName: 'John',
	lastName: 'Doe',
	role: 'Member',
	isActive: true,
	createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

function makePrismaMock() {
	return {
		user: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
	};
}

describe('POST /auth/login', () => {
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

	it('returns 200 with accessToken on valid credentials', async () => {
		prisma.user.findUnique.mockResolvedValue(mockUser);

		const res = await app.inject({
			method: 'POST',
			url: '/api/auth/login',
			payload: { email: 'john@example.com', password: VALID_PASSWORD },
		});

		expect(res.statusCode).toBe(200);
		const body = res.json<{ accessToken: string }>();
		expect(body.accessToken).toBeDefined();
		expect(typeof body.accessToken).toBe('string');
	});

	it('returns 401 on wrong password', async () => {
		prisma.user.findUnique.mockResolvedValue(mockUser);

		const res = await app.inject({
			method: 'POST',
			url: '/api/auth/login',
			payload: { email: 'john@example.com', password: 'Wrongpassword1!' },
		});

		expect(res.statusCode).toBe(401);
		expect(res.json<{ message: string }>().message).toBe('Invalid credentials');
	});

	it('returns 401 when user does not exist', async () => {
		prisma.user.findUnique.mockResolvedValue(null);

		const res = await app.inject({
			method: 'POST',
			url: '/api/auth/login',
			payload: { email: 'unknown@example.com', password: VALID_PASSWORD },
		});

		expect(res.statusCode).toBe(401);
	});

	it('returns 401 when user is inactive', async () => {
		prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

		const res = await app.inject({
			method: 'POST',
			url: '/api/auth/login',
			payload: { email: 'john@example.com', password: VALID_PASSWORD },
		});

		expect(res.statusCode).toBe(401);
	});

	it('returns 400 on missing body fields', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/api/auth/login',
			payload: { email: 'john@example.com' },
		});

		expect(res.statusCode).toBe(400);
	});
});

describe('GET /auth/profile', () => {
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

	it('returns 200 with user profile when authenticated', async () => {
		const profileUser = {
			id: mockUser.id,
			email: mockUser.email,
			firstName: mockUser.firstName,
			lastName: mockUser.lastName,
			role: mockUser.role,
			isActive: mockUser.isActive,
			createdAt: mockUser.createdAt,
		};
		prisma.user.findUnique.mockResolvedValue(profileUser);

		await app.ready();
		const token = app.jwt.sign({
			userId: 1,
			email: 'john@example.com',
			role: 'Member',
		});

		const res = await app.inject({
			method: 'GET',
			url: '/api/auth/profile',
			headers: { authorization: `Bearer ${token}` },
		});

		expect(res.statusCode).toBe(200);
		const body = res.json<typeof profileUser & { createdAt: string }>();
		expect(body.email).toBe('john@example.com');
		expect(body.firstName).toBe('John');
		expect(typeof body.createdAt).toBe('string');
	});

	it('returns 401 without token', async () => {
		const res = await app.inject({
			method: 'GET',
			url: '/api/auth/profile',
		});

		expect(res.statusCode).toBe(401);
	});

	it('returns 401 with invalid token', async () => {
		const res = await app.inject({
			method: 'GET',
			url: '/api/auth/profile',
			headers: { authorization: 'Bearer invalidtoken' },
		});

		expect(res.statusCode).toBe(401);
	});

	it('returns 404 when user no longer exists', async () => {
		prisma.user.findUnique.mockResolvedValue(null);

		await app.ready();
		const token = app.jwt.sign({
			userId: 999,
			email: 'gone@example.com',
			role: 'Member',
		});

		const res = await app.inject({
			method: 'GET',
			url: '/api/auth/profile',
			headers: { authorization: `Bearer ${token}` },
		});

		expect(res.statusCode).toBe(404);
	});
});

describe('POST /auth/forgot-password', () => {
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

	it('returns 200 with resetToken when user exists (non-production)', async () => {
		prisma.user.findUnique.mockResolvedValue(mockUser);
		prisma.user.update.mockResolvedValue(mockUser);

		const res = await app.inject({
			method: 'POST',
			url: '/api/auth/forgot-password',
			payload: { email: 'john@example.com' },
		});

		expect(res.statusCode).toBe(200);
		const body = res.json<{ message: string; resetToken?: string }>();
		expect(body.message).toContain('reset link');
		// NODE_ENV=test → token is returned
		expect(body.resetToken).toBeDefined();
		expect(typeof body.resetToken).toBe('string');
		expect(body.resetToken).toHaveLength(64); // 32 bytes hex
	});

	it('returns 200 with same message when user does not exist (prevents enumeration)', async () => {
		prisma.user.findUnique.mockResolvedValue(null);

		const res = await app.inject({
			method: 'POST',
			url: '/api/auth/forgot-password',
			payload: { email: 'unknown@example.com' },
		});

		expect(res.statusCode).toBe(200);
		const body = res.json<{ message: string }>();
		expect(body.message).toContain('reset link');
	});
});

describe('POST /auth/reset-password', () => {
	let app: ReturnType<typeof buildTestApp>;
	let prisma: ReturnType<typeof makePrismaMock>;
	const validToken = 'a'.repeat(64);

	beforeEach(() => {
		prisma = makePrismaMock();
		app = buildTestApp(prisma as never);
	});

	afterEach(async () => {
		await app.close();
		vi.clearAllMocks();
	});

	it('returns 200 on successful password reset', async () => {
		prisma.user.findUnique.mockResolvedValue({
			id: 1,
			email: 'john@example.com',
			passwordResetExpires: new Date(Date.now() + 30 * 60 * 1000),
		});
		prisma.user.update.mockResolvedValue(mockUser);

		const res = await app.inject({
			method: 'POST',
			url: '/api/auth/reset-password',
			payload: { token: validToken, password: VALID_PASSWORD },
		});

		expect(res.statusCode).toBe(200);
		expect(res.json<{ message: string }>().message).toBe(
			'Password reset successfully',
		);
	});

	it('returns 400 when token does not exist', async () => {
		prisma.user.findUnique.mockResolvedValue(null);

		const res = await app.inject({
			method: 'POST',
			url: '/api/auth/reset-password',
			payload: { token: validToken, password: VALID_PASSWORD },
		});

		expect(res.statusCode).toBe(400);
		expect(res.json<{ message: string }>().message).toContain(
			'Invalid or expired',
		);
	});

	it('returns 400 when token is expired', async () => {
		prisma.user.findUnique.mockResolvedValue({
			id: 1,
			email: 'john@example.com',
			passwordResetExpires: new Date(Date.now() - 60 * 1000), // past
		});

		const res = await app.inject({
			method: 'POST',
			url: '/api/auth/reset-password',
			payload: { token: validToken, password: 'newpassword123' },
		});

		expect(res.statusCode).toBe(400);
	});

	it('returns 400 when new password is too short', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/api/auth/reset-password',
			payload: { token: validToken, password: 'short' },
		});

		expect(res.statusCode).toBe(400);
	});
});

describe('PUT /auth/change-password', () => {
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

	it('returns 200 on successful password change', async () => {
		prisma.user.findUnique.mockResolvedValue({
			id: mockUser.id,
			email: mockUser.email,
			password: mockUser.password,
			isActive: true,
		});
		prisma.user.update.mockResolvedValue(mockUser);

		await app.ready();
		const token = app.jwt.sign({
			userId: 1,
			email: 'john@example.com',
			role: 'Member',
		});

		const res = await app.inject({
			method: 'PUT',
			url: '/api/auth/change-password',
			headers: { authorization: `Bearer ${token}` },
			payload: {
				currentPassword: VALID_PASSWORD,
				newPassword: 'New@password456',
			},
		});

		expect(res.statusCode).toBe(200);
		expect(res.json<{ message: string }>().message).toBe(
			'Password changed successfully',
		);
	});

	it('returns 400 when current password is wrong', async () => {
		prisma.user.findUnique.mockResolvedValue({
			id: mockUser.id,
			email: mockUser.email,
			password: mockUser.password,
			isActive: true,
		});

		await app.ready();
		const token = app.jwt.sign({
			userId: 1,
			email: 'john@example.com',
			role: 'Member',
		});

		const res = await app.inject({
			method: 'PUT',
			url: '/api/auth/change-password',
			headers: { authorization: `Bearer ${token}` },
			payload: {
				currentPassword: 'wrongpassword',
				newPassword: 'newpassword456',
			},
		});

		expect(res.statusCode).toBe(400);
		expect(res.json<{ message: string }>().message).toBe(
			'body/currentPassword At least one uppercase letter, body/currentPassword At least one number, body/currentPassword At least one special character, body/newPassword At least one uppercase letter, body/newPassword At least one special character',
		);
	});

	it('returns 401 without authentication token', async () => {
		const res = await app.inject({
			method: 'PUT',
			url: '/api/auth/change-password',
			payload: {
				currentPassword: VALID_PASSWORD,
				newPassword: 'New@password456',
			},
		});

		expect(res.statusCode).toBe(401);
	});

	it('returns 400 when new password is too short', async () => {
		await app.ready();
		const token = app.jwt.sign({
			userId: 1,
			email: 'john@example.com',
			role: 'Member',
		});

		const res = await app.inject({
			method: 'PUT',
			url: '/api/auth/change-password',
			headers: { authorization: `Bearer ${token}` },
			payload: { currentPassword: 'password123', newPassword: 'short' },
		});

		expect(res.statusCode).toBe(400);
	});
});
