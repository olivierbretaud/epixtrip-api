import type { PrismaClient } from '@prisma/client';

export function createAuthRepository(prisma: PrismaClient) {
	return {
		async findByEmail(email: string) {
			return prisma.user.findUnique({
				where: { email },
				select: {
					id: true,
					email: true,
					password: true,
					firstName: true,
					lastName: true,
					role: true,
					isActive: true,
					createdAt: true,
				},
			});
		},

		async findById(id: number) {
			return prisma.user.findUnique({
				where: { id },
				select: {
					id: true,
					email: true,
					firstName: true,
					lastName: true,
					role: true,
					isActive: true,
					createdAt: true,
				},
			});
		},

		async findByIdWithPassword(id: number) {
			return prisma.user.findUnique({
				where: { id },
				select: {
					id: true,
					email: true,
					password: true,
					isActive: true,
				},
			});
		},

		async findByResetToken(token: string) {
			return prisma.user.findUnique({
				where: { passwordResetToken: token },
				select: {
					id: true,
					email: true,
					passwordResetExpires: true,
				},
			});
		},

		async setResetToken(userId: number, token: string, expires: Date) {
			return prisma.user.update({
				where: { id: userId },
				data: { passwordResetToken: token, passwordResetExpires: expires },
			});
		},

		async updatePassword(userId: number, hashedPassword: string) {
			return prisma.user.update({
				where: { id: userId },
				data: {
					password: hashedPassword,
					passwordResetToken: null,
					passwordResetExpires: null,
				},
			});
		},
	};
}
