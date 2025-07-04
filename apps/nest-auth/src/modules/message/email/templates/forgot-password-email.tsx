import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Button,
} from '@react-email/components';
import * as React from 'react';

interface ForgotPasswordEmailProps {
  userEmail: string;
  resetToken: string;
  resetLink: string;
}

export const ForgotPasswordEmail = ({
  userEmail,
  resetToken,
  resetLink,
}: ForgotPasswordEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            {/* You can add your logo here */}
            <Text style={logoText}>lil-frankenstack</Text>
          </Section>

          <Section style={contentContainer}>
            <Heading style={heading}>Reset Your Password</Heading>

            <Text style={paragraph}>Hello,</Text>

            <Text style={paragraph}>
              We received a request to reset the password for your account (
              <span style={highlight}>{userEmail}</span>).
            </Text>

            <Text style={paragraph}>
              Please click the button below to set a new password:
            </Text>

            <Section style={buttonContainer}>
              <Button style={buttonStyle} href={resetLink}>
                Reset Password
              </Button>
            </Section>

            <Text style={paragraph}>
              This link will expire in <span style={highlight}>1 hour</span>. If
              you didn't make this request, you can safely ignore this email.
            </Text>

            <Section style={codeContainer}>
              <Text style={codeLabel}>Your reset token:</Text>
              <Text style={codeBox}>{resetToken}</Text>
            </Section>
          </Section>

          <Hr style={divider} />

          <Section>
            <Text style={footer}>
              © {new Date().getFullYear()} Your Company. All rights reserved.
            </Text>
            <Text style={footerLinks}>
              <Link style={footerLink} href="#">
                Privacy Policy
              </Link>{' '}
              •
              <Link style={footerLink} href="#">
                Terms of Service
              </Link>{' '}
              •
              <Link style={footerLink} href="#">
                Contact Support
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Modern email styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
};

const logoContainer = {
  backgroundColor: '#4f46e5', // Indigo color, change to match your brand
  padding: '30px 20px',
  textAlign: 'center' as const,
};

const logoText = {
  color: '#ffffff',
  fontSize: '26px',
  fontWeight: 'bold' as const,
  margin: '0',
};

const contentContainer = {
  padding: '40px 30px',
};

const heading = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#252f3f',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#4b5563',
  margin: '16px 0',
};

const highlight = {
  color: '#4f46e5',
  fontWeight: '600',
};

const buttonContainer = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const buttonStyle = {
  backgroundColor: '#4f46e5',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  padding: '14px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  transition: 'background-color 0.3s',
};

const codeContainer = {
  margin: '32px 0',
  padding: '20px',
  backgroundColor: '#f3f4f6',
  borderRadius: '6px',
  border: '1px solid #e5e7eb',
};

const codeLabel = {
  fontSize: '14px',
  color: '#6b7280',
  marginBottom: '8px',
  fontWeight: '500',
};

const codeBox = {
  fontSize: '16px',
  color: '#000000',
  fontFamily: 'monospace',
  padding: '8px 12px',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '4px',
  fontWeight: 'bold',
};

const divider = {
  borderTop: '1px solid #e5e7eb',
  margin: '0',
};

const footer = {
  fontSize: '13px',
  color: '#6b7280',
  textAlign: 'center' as const,
  margin: '24px 0 8px',
};

const footerLinks = {
  fontSize: '13px',
  color: '#6b7280',
  textAlign: 'center' as const,
  margin: '8px 0 24px',
};

const footerLink = {
  color: '#6b7280',
  textDecoration: 'underline',
  margin: '0 4px',
};

export default ForgotPasswordEmail;
