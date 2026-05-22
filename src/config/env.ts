import { z } from 'zod';

const envSchema = z.object({
	POSTGRES_PRISMA_URL: z.url(),
	POSTGRES_URL_NON_POOLING: z.url().optional(),
	NODE_ENV: z
		.enum(['development', 'production', 'test'])
		.default('development'),
	PORT: z.coerce.number().default(3000),
	HOST: z.string().default('0.0.0.0'),
	JWT_SECRET: z.string().min(32),
	SMTP_HOST: z.string().default('SMTP_HOST'),
	SMTP_PORT: z.coerce.number().default(587),
	SMTP_SECURE: z
		.string()
		.transform((v) => v === 'true')
		.default(false),
	SMTP_USER: z.string().default('SMTP_USER'),
	SMTP_PASS: z.string().default('SMTP_PASS'),
	EMAIL_FROM: z.string().default('EpixTrip <no-reply@epixtrip.com>'),
	APP_URL: z.url().default('http://localhost:3000'),
	CLOUDINARY_CLOUD_NAME: z.string(),
	CLOUDINARY_API_KEY: z.string(),
	CLOUDINARY_API_SECRET: z.string(),
	AUTH_EMAIL: z.string().optional(),
	AUTH_PWD: z.string().optional(),
});

export const env = envSchema.parse(process.env);
