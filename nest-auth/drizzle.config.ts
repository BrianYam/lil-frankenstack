import { defineConfig } from 'drizzle-kit';
import { getDatabaseConfig } from '@/database/utils.database';

const config = getDatabaseConfig();

// For drizzle SSL only works with db credentials not connection string
export default defineConfig({
  out: './drizzle',
  schema: './src/database/schema/**.schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    ...(config.ssl
      ? {
          host: config.DB_HOST,
          port: config.DB_PORT,
          user: config.DB_USER,
          password: config.DB_PASSWORD,
          database: config.DB_NAME,
          ssl: config.ssl,
        }
      : {
          url: config.connectionString,
        }),
  },
  migrations: {
    table: 'drizzle_migrations',
    schema: 'public',
  },
});
