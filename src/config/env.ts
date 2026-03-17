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
	SMTP_HOST: z.string(),
	SMTP_PORT: z.coerce.number().default(587),
	SMTP_SECURE: z
		.string()
		.transform((v) => v === 'true')
		.default(false),
	SMTP_USER: z.string(),
	SMTP_PASS: z.string(),
	EMAIL_FROM: z.string().default('EpixTrip <no-reply@epixtrip.com>'),
	APP_URL: z.url().default('http://localhost:3000'),
});

export const env = envSchema.parse(process.env);
