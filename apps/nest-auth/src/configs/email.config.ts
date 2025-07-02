import { registerAs } from '@nestjs/config';
import { getEnvVar } from './config.utils';

export default registerAs('email', () => ({
  resendApiKey: getEnvVar('RESEND_API_KEY', true),
  noReplyEmailDomain: getEnvVar('NO_REPLY_EMAIL_DOMAIN', true),
}));
