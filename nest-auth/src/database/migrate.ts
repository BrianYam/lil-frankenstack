/**
 * Migration script for Drizzle ORM
 * Applies pending migrations to the database
 */
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { getDatabaseConfig } from '@/database/utils.database';

// Load environment variables
dotenv.config();

// Main migration function
async function main() {
  console.log('Starting database migration...');

  // Get database configuration using the shared utility
  const dbConfig = getDatabaseConfig();

  // Create postgres connection for migration using the connectionString from dbConfig
  const sql = postgres(dbConfig.connectionString, { max: 1 });

  // Create Drizzle instance
  const db = drizzle(sql);

  // Run migrations from the specified directory
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: 'drizzle' });

  // Close the connection
  await sql.end();
  console.log('Migration completed successfully');
}

// Run migration and handle errors
main().catch((e) => {
  console.error('Migration failed:');
  console.error(e);
  process.exit(1);
});
