import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';

/**
 * Configuration constants for environment variables
 * Using constants/enums instead of string literals improves maintainability and type safety
 */

export const PRODUCTION = 'production';
export const STAGING = 'staging';
export enum ENV {
  NODE_ENV = 'NODE_ENV',

  // JWT
  JWT_ACCESS_TOKEN_SECRET = 'JWT_ACCESS_TOKEN_SECRET',
  JWT_REFRESH_TOKEN_SECRET = 'JWT_REFRESH_TOKEN_SECRET',
  JWT_ACCESS_TOKEN_EXPIRATION_TIME_MS = 'JWT_ACCESS_TOKEN_EXPIRATION_TIME_MS',
  JWT_REFRESH_TOKEN_EXPIRATION_TIME_MS = 'JWT_REFRESH_TOKEN_EXPIRATION_TIME_MS',

  // AUTH
  AUTH_UI_REDIRECT_URL = 'AUTH_UI_REDIRECT_URL',
  API_KEY = 'API_KEY',

  // OAUTH
  GOOGLE_AUTH_CLIENT_ID = 'GOOGLE_AUTH_CLIENT_ID',
  GOOGLE_AUTH_CLIENT_SECRET = 'GOOGLE_AUTH_CLIENT_SECRET',
  GOOGLE_AUTH_REDIRECT_URI = 'GOOGLE_AUTH_REDIRECT_URI',

  // EMAIL
  RESEND_API_KEY = 'RESEND_API_KEY',
  NO_REPLY_EMAIL_DOMAIN = 'NO_REPLY_EMAIL_DOMAIN',
}

export type DrizzleDB = NodePgDatabase<typeof schema>;

export type DatabaseConfig = {
  connectionString: string;
  ssl:
    | {
        ca: string;
        rejectUnauthorized: boolean;
      }
    | undefined;
  DB_HOST: string;
  DB_NAME: string;
  DB_PASSWORD: string;
  DB_PORT: number;
  DB_USER: string;
};

export type DbEnvVars = {
  DB_HOST: string;
  DB_PORT: string;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
};
