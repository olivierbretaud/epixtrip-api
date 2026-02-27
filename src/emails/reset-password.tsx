import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Preview,
	Section,
	Text,
} from '@react-email/components';
import * as React from 'react';
import { render } from '@react-email/components';

interface ResetPasswordEmailProps {
	firstName: string;
	resetLink: string;
}

export function ResetPasswordEmail({ firstName, resetLink }: ResetPasswordEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>Reset your EpixTrip password</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={logoSection}>
						<Text style={logoText}>EpixTrip</Text>
					</Section>

					<Heading style={heading}>Reset your password</Heading>

					<Text style={paragraph}>Hi {firstName},</Text>
					<Text style={paragraph}>
						We received a request to reset the password for your EpixTrip account. Click the
						button below to choose a new password.
					</Text>

					<Section style={buttonSection}>
						<Button style={button} href={resetLink}>
							Reset password
						</Button>
					</Section>

					<Text style={paragraph}>
						This link will expire in <strong>1 hour</strong>. If you did not request a password
						reset, you can safely ignore this email — your password will not be changed.
					</Text>

					<Hr style={hr} />

					<Text style={footer}>
						If the button above doesn&apos;t work, copy and paste this link into your browser:
					</Text>
					<Text style={link}>{resetLink}</Text>

					<Hr style={hr} />

					<Text style={footer}>
						&copy; {new Date().getFullYear()} EpixTrip. All rights reserved.
					</Text>
				</Container>
			</Body>
		</Html>
	);
}

export async function renderResetPasswordEmail(props: ResetPasswordEmailProps): Promise<string> {
	return render(<ResetPasswordEmail {...props} />);
}

const main: React.CSSProperties = {
	backgroundColor: '#f6f9fc',
	fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
};

const container: React.CSSProperties = {
	backgroundColor: '#ffffff',
	margin: '40px auto',
	padding: '40px',
	borderRadius: '8px',
	maxWidth: '560px',
	boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
};

const logoSection: React.CSSProperties = {
	marginBottom: '32px',
};

const logoText: React.CSSProperties = {
	fontSize: '24px',
	fontWeight: '700',
	color: '#1a1a2e',
	margin: '0',
};

const heading: React.CSSProperties = {
	fontSize: '24px',
	fontWeight: '600',
	color: '#1a1a2e',
	margin: '0 0 24px',
};

const paragraph: React.CSSProperties = {
	fontSize: '15px',
	lineHeight: '24px',
	color: '#4a5568',
	margin: '0 0 16px',
};

const buttonSection: React.CSSProperties = {
	margin: '32px 0',
	textAlign: 'center',
};

const button: React.CSSProperties = {
	backgroundColor: '#4f46e5',
	borderRadius: '6px',
	color: '#ffffff',
	fontSize: '15px',
	fontWeight: '600',
	padding: '12px 32px',
	textDecoration: 'none',
	display: 'inline-block',
};

const hr: React.CSSProperties = {
	borderColor: '#e2e8f0',
	margin: '24px 0',
};

const footer: React.CSSProperties = {
	fontSize: '12px',
	color: '#a0aec0',
	margin: '0 0 8px',
};

const link: React.CSSProperties = {
	fontSize: '12px',
	color: '#4f46e5',
	wordBreak: 'break-all',
	margin: '0 0 16px',
};
