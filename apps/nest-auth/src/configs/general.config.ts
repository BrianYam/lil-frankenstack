import { registerAs } from '@nestjs/config';
import { getEnvVar, getEnvVarAsNumber } from './config.utils';

export default registerAs('general', () => ({
  nodeEnv: getEnvVar('NODE_ENV', false, 'development'),
  logLevel: getEnvVar('LOG_LEVEL', false, 'info'),
  corsOrigin: getEnvVar('CORS_ORIGIN', true),
  port: getEnvVarAsNumber('PORT', 4000),
}));
