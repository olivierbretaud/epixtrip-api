import { z } from 'zod';

export const mediaParams = z.object({
	travelId: z.coerce.number().int().positive(),
});

export const mediaResponse = z.object({
	id: z.number(),
	url: z.string(),
	mimeType: z.string(),
	size: z.number(),
	takenAt: z.string().nullable(),
	lat: z.number().nullable(),
	lng: z.number().nullable(),
	place: z.string().nullable(),
	description: z.string().nullable(),
	city: z.string().nullable(),
	region: z.string().nullable(),
	state: z.string().nullable(),
	countryCode: z.string().nullable(),
	travelId: z.number(),
	createdAt: z.string(),
});

export const updateMediaBody = z.object({
	place: z.string().max(255).nullable().optional(),
	description: z.string().max(2000).nullable().optional(),
	isCover: z.boolean().optional(),
});

export const mediaListResponse = z.array(mediaResponse);

export const ALLOWED_MIME_TYPES = [
	'image/jpeg',
	'image/webp',
	'video/mp4',
	'video/webm',
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function mimeToResourceType(
	mimeType: string,
): 'image' | 'video' | 'raw' {
	if (mimeType.startsWith('image/')) return 'image';
	if (mimeType.startsWith('video/')) return 'video';
	return 'raw';
}
