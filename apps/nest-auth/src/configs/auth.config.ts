import { registerAs } from '@nestjs/config';
import { getEnvVar, getEnvVarAsNumber } from './config.utils';

export default registerAs('auth', () => {
  return {
    jwtAccessTokenSecret: getEnvVar('JWT_ACCESS_TOKEN_SECRET', true),
    jwtRefreshTokenSecret: getEnvVar('JWT_REFRESH_TOKEN_SECRET', true),
    jwtAccessTokenExpirationTimeMs: getEnvVarAsNumber(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME_MS',
      3600000, // 60 minutes default
    ),
    jwtRefreshTokenExpirationTimeMs: getEnvVarAsNumber(
      'JWT_REFRESH_TOKEN_EXPIRATION_TIME_MS',
      604800000, // 7 days default
    ),
    authUiRedirectUrl: getEnvVar('AUTH_UI_REDIRECT_URL', true),
    apiKey: getEnvVar('API_KEY', true),
  };
});
