import { registerAs } from '@nestjs/config';

export default registerAs('general', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  port: parseInt(process.env.PORT, 10) || 4000,
}));
