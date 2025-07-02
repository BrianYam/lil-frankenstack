import { registerAs } from '@nestjs/config';
import { getEnvVar } from './config.utils';

export default registerAs('googleOAuth', () => ({
  clientId: getEnvVar('GOOGLE_AUTH_CLIENT_ID'),
  clientSecret: getEnvVar('GOOGLE_AUTH_CLIENT_SECRET'),
  callbackUrl: getEnvVar('GOOGLE_AUTH_REDIRECT_URI', true),
}));
