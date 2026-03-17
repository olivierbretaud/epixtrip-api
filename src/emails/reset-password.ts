import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	render,
	Section,
	Text,
} from '@react-email/components';
import React from 'react';

interface ResetPasswordEmailProps {
	firstName: string;
	resetLink: string;
}

function ResetPasswordEmail({ firstName, resetLink }: ResetPasswordEmailProps) {
	return React.createElement(
		Html,
		null,
		React.createElement(Head, null),
		React.createElement(Preview, null, 'Reset your EpixTrip password'),
		React.createElement(
			Body,
			{ style: main },
			React.createElement(
				Container,
				{ style: container },
				React.createElement(
					Section,
					{ style: logoSection },
					React.createElement(Text, { style: logoText }, 'EpixTrip'),
				),
				React.createElement(Heading, { style: heading }, 'Reset your password'),
				React.createElement(Text, { style: paragraph }, `Hi ${firstName},`),
				React.createElement(
					Text,
					{ style: paragraph },
					'We received a request to reset the password for your EpixTrip account. Click the button below to choose a new password.',
				),
				React.createElement(
					Section,
					{ style: buttonSection },
					React.createElement(
						Button,
						{ style: button, href: resetLink },
						'Reset password',
					),
				),
				React.createElement(
					Text,
					{ style: paragraph },
					'This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email — your password will not be changed.',
				),
				React.createElement(Hr, { style: hr }),
				React.createElement(
					Text,
					{ style: footer },
					"If the button above doesn't work, copy and paste this link into your browser:",
				),
				React.createElement(Text, { style: link }, resetLink),
				React.createElement(Hr, { style: hr }),
				React.createElement(
					Text,
					{ style: footer },
					`© ${new Date().getFullYear()} EpixTrip. All rights reserved.`,
				),
			),
		),
	);
}

export async function renderResetPasswordEmail(
	props: ResetPasswordEmailProps,
): Promise<string> {
	return render(React.createElement(ResetPasswordEmail, props));
}

const main: React.CSSProperties = {
	backgroundColor: '#f6f9fc',
	fontFamily:
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
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
