import { randomUUID } from 'node:crypto';
import { createWriteStream, mkdirSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import type { MultipartFile } from '@fastify/multipart';
import exifr from 'exifr';
import type { FastifyInstance } from 'fastify';
import { env } from '../../config/env.js';
import { AppError } from '../../errors/AppError.js';
import {
	deleteFromCloudinary,
	uploadToCloudinary,
} from '../../lib/cloudinary.js';
import { reverseGeocode } from '../../lib/photon.js';
import { createTravelRepository } from '../travel/repository.js';
import { createMediaRepository } from './repository.js';
import {
	ALLOWED_MIME_TYPES,
	MAX_FILE_SIZE,
	mimeToResourceType,
} from './schema.js';

const TEMP_DIR = join(tmpdir(), 'medias');
const CLOUDINARY_FOLDER = `epixtrip/${env.NODE_ENV}`;

async function extractExif(
	filePath: string,
): Promise<{ takenAt: Date | null; lat: number | null; lng: number | null }> {
	try {
		const data = await exifr.parse(filePath, {
			tiff: true,
			exif: true,
			gps: true,
			xmp: false,
			icc: false,
			iptc: false,
		});
		console.log('[extractExif] raw data:', JSON.stringify(data));
		if (!data) return { takenAt: null, lat: null, lng: null };
		const gps = await exifr.gps(filePath).catch(() => null);
		console.log('[extractExif] gps:', JSON.stringify(gps));
		return {
			takenAt:
				data.DateTimeOriginal instanceof Date ? data.DateTimeOriginal : null,
			lat: gps?.latitude ?? null,
			lng: gps?.longitude ?? null,
		};
	} catch (err) {
		console.log('[extractExif] error:', err);
		return { takenAt: null, lat: null, lng: null };
	}
}

function streamToFile(
	readable: NodeJS.ReadableStream,
	dest: string,
	maxSize: number,
): Promise<number> {
	return new Promise((resolve, reject) => {
		let size = 0;
		let aborted = false;
		const writer = createWriteStream(dest);

		readable.on('data', (chunk: Buffer) => {
			if (aborted) return;
			size += chunk.length;
			if (size > maxSize) {
				aborted = true;
				writer.destroy();
				readable.resume();
				reject(new AppError(413, ''));
			}
		});
		readable.on('error', (err) => {
			if (!aborted) reject(err);
		});
		writer.on('error', (err) => {
			if (!aborted) reject(err);
		});
		writer.on('finish', () => {
			if (!aborted) resolve(size);
		});
		readable.pipe(writer);
	});
}

export function createMediaService(fastify: FastifyInstance) {
	const repo = createMediaRepository(fastify);

	const travelRepo = createTravelRepository(fastify.prisma);

	return {
		async uploadMany(
			travelId: number,
			files: AsyncIterableIterator<MultipartFile>,
		) {
			mkdirSync(TEMP_DIR, { recursive: true });

			const toInsert: {
				url: string;
				key: string;
				mimeType: string;
				size: number;
				takenAt: Date | null;
				lat: number | null;
				lng: number | null;
				city: string | null;
				region: string | null;
				state: string | null;
				countryCode: string | null;
				travelId: number;
			}[] = [];

			for await (const file of files) {
				if (
					!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)
				) {
					file.file.resume();
					throw new AppError(
						400,
						`Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
					);
				}

				const ext = extname(file.filename) || '';
				const uuid = randomUUID();
				const tempPath = join(TEMP_DIR, `${uuid}${ext}`);

				const size = await streamToFile(
					file.file,
					tempPath,
					MAX_FILE_SIZE,
				).catch((err) => {
					try {
						unlinkSync(tempPath);
					} catch {
						/* already gone */
					}
					if (err instanceof AppError)
						throw new AppError(
							413,
							`File "${file.filename}" exceeds the ${MAX_FILE_SIZE / 1024 / 1024} MB limit`,
						);
					throw new AppError(500, `Failed to read file "${file.filename}"`);
				});

				const exif = await extractExif(tempPath);

				if (
					exif.lat === null ||
					exif.lng === null ||
					!Number.isFinite(exif.lat) ||
					!Number.isFinite(exif.lng)
				) {
					unlinkSync(tempPath);
					throw new AppError(422, `File "${file.filename}" has no GPS data`);
				}

				const geo = await reverseGeocode(exif.lat, exif.lng).catch(() => null);

				const publicId = `${CLOUDINARY_FOLDER}/${travelId}/${uuid}`;
				const resourceType = mimeToResourceType(file.mimetype);

				let url: string;
				try {
					url = await uploadToCloudinary(tempPath, publicId, resourceType);
				} catch {
					throw new AppError(502, `Failed to upload file "${file.filename}"`);
				} finally {
					unlinkSync(tempPath);
				}

				toInsert.push({
					url,
					key: publicId,
					mimeType: file.mimetype,
					size,
					...exif,
					city: geo?.city ?? null,
					region: geo?.region ?? null,
					state: geo?.state ?? null,
					countryCode: geo?.country_code ?? null,
					travelId,
				});
			}

			if (toInsert.length === 0) {
				throw new AppError(400, 'No files provided');
			}

			const created = await repo.createMany(toInsert);

			const firstImage = created.find((m) => m.mimeType.startsWith('image/'));
			if (firstImage) {
				await travelRepo.setCoverIfEmpty(travelId, firstImage.id);
			}

			return created;
		},

		async getByTravel(travelId: number) {
			return repo.findByTravel(travelId);
		},

		async updateOne(
			id: number,
			data: {
				place?: string | null;
				description?: string | null;
				isCover?: boolean;
			},
		) {
			const { isCover, ...mediaData } = data;

			const hasMetaUpdate =
				mediaData.place !== undefined || mediaData.description !== undefined;

			let media: Awaited<ReturnType<typeof repo.findById>>;
			if (hasMetaUpdate) {
				media = await repo.updateOne(id, mediaData);
			} else {
				media = await repo.findById(id);
			}

			if (!media) throw new AppError(404, 'Media not found');

			if (isCover) {
				await travelRepo.setCover(media.travelId, id);
			}

			return media;
		},

		async deleteOne(id: number) {
			const wasCover = await repo.isCover(id);
			const media = await repo.deleteOne(id);
			const resourceType = mimeToResourceType(media.mimeType);
			await deleteFromCloudinary(media.key, resourceType).catch(() => null);

			if (wasCover) {
				const firstImage = await repo.findFirstImageByTravel(media.travelId);
				if (firstImage) {
					await travelRepo.setCover(media.travelId, firstImage.id);
				}
			}

			return media;
		},
	};
}
