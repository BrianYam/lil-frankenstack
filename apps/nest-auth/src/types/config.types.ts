import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';

/**
 * Configuration constants for environment variables
 * Using constants/enums instead of string literals improves maintainability and type safety
 */

export const PRODUCTION = 'production';
export const STAGING = 'staging';

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
