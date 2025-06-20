import { registerAs } from '@nestjs/config';

export default registerAs('googleOAuth', () => ({
  clientId: process.env.GOOGLE_AUTH_CLIENT_ID,
  clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
  callbackUrl:
    process.env.GOOGLE_AUTH_REDIRECT_URI ||
    'http://localhost:3000/auth/google/callback',
}));
