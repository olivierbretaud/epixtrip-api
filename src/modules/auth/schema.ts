import { z } from 'zod';

export const loginBody = z.object({
	email: z.string().min(1),
	password: z.string().min(1),
});

export const loginResponse = z.object({
	accessToken: z.string(),
});

export const forgotPasswordBody = z.object({
	email: z.string().min(1),
});

export const forgotPasswordResponse = z.object({
	message: z.string(),
	resetToken: z.string().optional(),
});

export const resetPasswordBody = z.object({
	token: z.string().min(1),
	password: z.string().min(8),
});

export const changePasswordBody = z.object({
	currentPassword: z.string().min(1),
	newPassword: z.string().min(8),
});

export const profileResponse = z.object({
	id: z.number(),
	email: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	role: z.string(),
	isActive: z.boolean(),
	createdAt: z.string(),
});

export const messageResponse = z.object({
	message: z.string(),
});
