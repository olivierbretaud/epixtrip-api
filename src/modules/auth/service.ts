import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { env } from '../../config/env.js';
import { renderResetPasswordEmail } from '../../emails/reset-password.js';
import { AppError } from '../../errors/AppError.js';
import { createAuthRepository } from './repository.js';

export function createAuthService(fastify: FastifyInstance) {
	const repo = createAuthRepository(fastify.prisma);

	return {
		async login(email: string, password: string) {
			const user = await repo.findByEmail(email);

			if (!user || !user.isActive) {
				throw new AppError(401, 'Invalid credentials');
			}

			const isValid = await bcrypt.compare(password, user.password);
			if (!isValid) {
				throw new AppError(401, 'Invalid credentials');
			}

			const accessToken = fastify.jwt.sign(
				{ userId: user.id, email: user.email, role: user.role },
				{ expiresIn: '7d' },
			);

			return { accessToken };
		},

		async getProfile(userId: number) {
			const user = await repo.findById(userId);
			if (!user) {
				throw new AppError(404, 'User not found');
			}
			return { ...user, createdAt: user.createdAt.toISOString() };
		},

		async forgotPassword(email: string) {
			const user = await repo.findByEmail(email);

			// Always return the same message to prevent user enumeration
			if (!user) {
				return { message: 'If this email exists, a reset link has been sent.' };
			}

			const token = randomBytes(32).toString('hex');
			const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
			await repo.setResetToken(user.id, token, expires);

			const resetLink = `${env.APP_URL}/reset-password?token=${token}`;
			const html = await renderResetPasswordEmail({
				firstName: user.firstName,
				resetLink,
			});

			await fastify.mailer.send({
				to: user.email,
				subject: 'Reset your EpixTrip password',
				html,
			});

			return {
				message: 'If this email exists, a reset link has been sent.',
				...(env.NODE_ENV !== 'production' && { resetToken: token }),
			};
		},

		async resetPassword(token: string, newPassword: string) {
			const user = await repo.findByResetToken(token);

			if (
				!user ||
				!user.passwordResetExpires ||
				user.passwordResetExpires < new Date()
			) {
				throw new AppError(400, 'Invalid or expired reset token');
			}

			const hashed = await bcrypt.hash(newPassword, 12);
			await repo.updatePassword(user.id, hashed);

			return { message: 'Password reset successfully' };
		},

		async changePassword(
			userId: number,
			currentPassword: string,
			newPassword: string,
		) {
			const user = await repo.findByIdWithPassword(userId);

			if (!user) {
				throw new AppError(404, 'User not found');
			}

			const isValid = await bcrypt.compare(currentPassword, user.password);
			if (!isValid) {
				throw new AppError(400, 'Current password is incorrect');
			}

			const hashed = await bcrypt.hash(newPassword, 12);
			await repo.updatePassword(userId, hashed);

			return { message: 'Password changed successfully' };
		},
	};
}
