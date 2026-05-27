import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

cloudinary.config({
	cloud_name: env.CLOUDINARY_CLOUD_NAME,
	api_key: env.CLOUDINARY_API_KEY,
	api_secret: env.CLOUDINARY_API_SECRET,
});

const IMAGE_TRANSFORMATION = 'q_auto,f_auto';
const VIDEO_TRANSFORMATION = 'q_auto,vc_auto';

function buildOptimizedUrl(
	publicId: string,
	resourceType: 'image' | 'video' | 'raw',
): string {
	if (resourceType === 'raw') {
		return cloudinary.url(publicId, { secure: true, resource_type: 'raw' });
	}
	const transformation =
		resourceType === 'video' ? VIDEO_TRANSFORMATION : IMAGE_TRANSFORMATION;
	return cloudinary.url(publicId, {
		secure: true,
		resource_type: resourceType,
		transformation: [{ raw_transformation: transformation }],
	});
}

export async function uploadToCloudinary(
	filePath: string,
	publicId: string,
	resourceType: 'image' | 'video' | 'raw',
): Promise<string> {
	const lastSlash = publicId.lastIndexOf('/');
	const folder = publicId.substring(0, lastSlash);
	const filename = publicId.substring(lastSlash + 1);

	const result = await cloudinary.uploader.upload(filePath, {
		public_id: filename,
		folder,
		resource_type: resourceType,
		overwrite: false,
	});

	return buildOptimizedUrl(result.public_id, resourceType);
}

export async function deleteFromCloudinary(
	publicId: string,
	resourceType: 'image' | 'video' | 'raw',
): Promise<void> {
	await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export async function deleteFolderFromCloudinary(
	folder: string,
): Promise<void> {
	await cloudinary.api.delete_folder(folder);
}
