import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';

/**
 * Configuration constants for environment variables
 * Using constants/enums instead of string literals improves maintainability and type safety
 */

//TODO dont need this, do the one below
/*
  export default registerAs('googleOAuth', () => ({
  clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || 'default-client-id',
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET
}
*/
export enum ENV {
  NODE_ENV = 'NODE_ENV',
  API_KEY = 'API_KEY',

  // JWT
  JWT_ACCESS_TOKEN_SECRET = 'JWT_ACCESS_TOKEN_SECRET',
  JWT_REFRESH_TOKEN_SECRET = 'JWT_REFRESH_TOKEN_SECRET',
  JWT_ACCESS_TOKEN_EXPIRATION_TIME_MS = 'JWT_ACCESS_TOKEN_EXPIRATION_TIME_MS',
  JWT_REFRESH_TOKEN_EXPIRATION_TIME_MS = 'JWT_REFRESH_TOKEN_EXPIRATION_TIME_MS',

  // AUTH
  AUTH_UI_REDIRECT_URL = 'AUTH_UI_REDIRECT_URL',

  // OAUTH
  GOOGLE_AUTH_CLIENT_ID = 'GOOGLE_AUTH_CLIENT_ID',
  GOOGLE_AUTH_CLIENT_SECRET = 'GOOGLE_AUTH_CLIENT_SECRET',
  GOOGLE_AUTH_REDIRECT_URI = 'GOOGLE_AUTH_REDIRECT_URI',
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
