import { z } from 'zod';

export const createTravelBody = z.object({
	title: z.string().min(1),
	description: z.string().min(1).optional(),
	isPublic: z.boolean().default(false).optional(),
});

export const updateTravelBody = z.object({
	title: z.string().min(1).optional(),
	description: z.string().min(1).optional(),
	isPublic: z.boolean().default(false).optional(),
});

export const travelParams = z.object({
	id: z.coerce.number().int().positive(),
});

export const travelResponse = z.object({
	id: z.number(),
	title: z.string(),
	description: z.string().nullable(),
	isPublic: z.boolean().default(false),
	authorId: z.number(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const travelListResponse = z.array(travelResponse);
