import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
	changePasswordBody,
	forgotPasswordBody,
	forgotPasswordResponse,
	loginBody,
	loginResponse,
	messageResponse,
	profileResponse,
	resetPasswordBody,
} from './schema.js';
import { createAuthService } from './service.js';

const authRoutes: FastifyPluginAsync = async (fastify) => {
	const authService = createAuthService(fastify);

	fastify.withTypeProvider<ZodTypeProvider>().post('/login', {
		config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
		schema: {
			tags: ['Auth'],
			summary: 'Login',
			description: 'Authenticate with email and password, returns a JWT access token.',
			body: loginBody,
			response: {
				200: loginResponse,
				401: z.object({ message: z.string() }),
			},
		},
	}, async (request) => {
		return authService.login(request.body.email, request.body.password);
	});

	fastify.withTypeProvider<ZodTypeProvider>().get('/profile', {
		schema: {
			tags: ['Auth'],
			summary: 'Get profile',
			description: 'Returns the authenticated user profile.',
			security: [{ bearerAuth: [] }],
			response: {
				200: profileResponse,
				401: z.object({ message: z.string() }),
				404: z.object({ message: z.string() }),
			},
		},
		preHandler: [fastify.authenticate],
	}, async (request) => {
		return authService.getProfile(request.user.userId);
	});

	fastify.withTypeProvider<ZodTypeProvider>().post('/forgot-password', {
		config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
		schema: {
			tags: ['Auth'],
			summary: 'Forgot password',
			description: 'Request a password reset token. In non-production, the token is returned directly.',
			body: forgotPasswordBody,
			response: {
				200: forgotPasswordResponse,
			},
		},
	}, async (request) => {
		return authService.forgotPassword(request.body.email);
	});

	fastify.withTypeProvider<ZodTypeProvider>().post('/reset-password', {
		schema: {
			tags: ['Auth'],
			summary: 'Reset password',
			description: 'Reset the password using a valid reset token (expires after 1 hour).',
			body: resetPasswordBody,
			response: {
				200: messageResponse,
				400: z.object({ message: z.string() }),
			},
		},
	}, async (request) => {
		return authService.resetPassword(request.body.token, request.body.password);
	});

	fastify.withTypeProvider<ZodTypeProvider>().put('/change-password', {
		schema: {
			tags: ['Auth'],
			summary: 'Change password',
			description: 'Change the password for the currently authenticated user.',
			security: [{ bearerAuth: [] }],
			body: changePasswordBody,
			response: {
				200: messageResponse,
				400: z.object({ message: z.string() }),
				401: z.object({ message: z.string() }),
			},
		},
		preHandler: [fastify.authenticate],
	}, async (request) => {
		return authService.changePassword(
			request.user.userId,
			request.body.currentPassword,
			request.body.newPassword,
		);
	});
};

export default authRoutes;
