import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { getDatabaseConfig } from '@/modules/database/utils.database';
import { DrizzleDB } from '@/types';

config();

const dbConfig = getDatabaseConfig();

const pool = new Pool(dbConfig);

export const db = drizzle(pool, { schema }) as DrizzleDB;
