/**
 * Schema definitions for PostgreSQL tables using Drizzle ORM
 * This file defines the structure of database tables and their relationships
 */
import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';

/**
 * Users table schema
 * Stores user data including authentication credentials
 */
export const usersTable = pgTable('users', {
  id: uuid('id').defaultRandom().notNull().primaryKey(),
  email: text('email').notNull().unique(),
  // Hashed password
  password: text('password').notNull(),
  refreshToken: text('refresh_token'),

  // Audit fields for record tracking
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
