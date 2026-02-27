import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';

export interface SendMailOptions {
	to: string;
	subject: string;
	html: string;
}

declare module 'fastify' {
	interface FastifyInstance {
		mailer: {
			send(options: SendMailOptions): Promise<void>;
		};
	}
}

const mailerPlugin: FastifyPluginAsync = fp(async (fastify) => {
	const transporter: Transporter = nodemailer.createTransport({
		host: env.SMTP_HOST,
		port: env.SMTP_PORT,
		secure: env.SMTP_SECURE,
		auth: {
			user: env.SMTP_USER,
			pass: env.SMTP_PASS,
		},
	});

	await transporter.verify();
	fastify.log.info('Mailer connected');

	fastify.decorate('mailer', {
		async send({ to, subject, html }: SendMailOptions): Promise<void> {
			await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html });
		},
	});

	fastify.addHook('onClose', () => {
		transporter.close();
	});
});

export default mailerPlugin;
