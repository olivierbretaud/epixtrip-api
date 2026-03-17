import { z } from 'zod';

const strongPassword = z
	.string()
	.min(8)
	.regex(/[A-Z]/, 'At least one uppercase letter')
	.regex(/[a-z]/, 'At least one lowercase letter')
	.regex(/[0-9]/, 'At least one number')
	.regex(/[^A-Za-z0-9]/, 'At least one special character');

export const loginBody = z.object({
	email: z.string().min(1),
	password: strongPassword,
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
	password: strongPassword,
});

export const changePasswordBody = z.object({
	currentPassword: strongPassword,
	newPassword: strongPassword,
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
