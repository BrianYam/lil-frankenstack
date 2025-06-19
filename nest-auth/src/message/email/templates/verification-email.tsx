import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import React from 'react';

interface VerificationEmailProps {
  userEmail: string;
  verificationToken: string;
  verificationLink: string;
}

export const VerificationEmail = ({
  userEmail,
  verificationToken,
  verificationLink,
}: VerificationEmailProps): React.ReactElement => {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Verify Your Email Address</Heading>
          <Text style={paragraph}>Hello {userEmail},</Text>
          <Text style={paragraph}>
            Thank you for creating an account with us. To complete your
            registration and activate your account, please verify your email
            address by clicking the button below:
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={verificationLink}>
              Verify Email Address
            </Button>
          </Section>
          <Text style={paragraph}>
            If the button doesn't work, you can also copy and paste the
            following link into your browser:
          </Text>
          <Text style={paragraph}>
            <Link href={verificationLink} style={link}>
              {verificationLink}
            </Link>
          </Text>
          <Text style={paragraph}>
            Your verification token is: <strong>{verificationToken}</strong>
          </Text>
          <Text style={paragraph}>
            This link will expire in 24 hours. If you did not create an account
            with us, please disregard this email.
          </Text>
          <Text style={paragraph}>
            Thank you,
            <br />
            The App Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '5px',
  maxWidth: '580px',
};

const heading = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
  textAlign: 'center' as const,
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#484848',
  marginBottom: '26px',
  padding: '0 30px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  marginBottom: '26px',
};

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  marginTop: '16px',
};

const link = {
  color: '#5469d4',
  textDecoration: 'underline',
};

export default VerificationEmail;
