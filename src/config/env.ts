import { z } from 'zod';

const envSchema = z.object({
	DATABASE_URL: z.url(),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.coerce.number().default(3000),
	HOST: z.string().default('0.0.0.0'),
	JWT_SECRET: z.string().min(32),
});

export const env = envSchema.parse(process.env);
