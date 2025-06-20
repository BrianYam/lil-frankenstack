import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  uuid,
  timestamp,
  pgEnum,
  boolean,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { UserRole } from '@/types';

export const userRoleEnum = pgEnum(
  'user_role',
  Object.values(UserRole) as [string, ...string[]],
);

/**
 * Users table schema
 * Stores user data including authentication credentials
 */
export const usersTable = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().notNull().primaryKey(),
    email: text('email').notNull(),
    // Hashed password
    password: text('password').notNull(),
    refreshToken: text('refresh_token'),
    role: userRoleEnum('role').default(UserRole.USER).notNull(),
    // User status
    isActive: boolean('is_active').default(false).notNull(),
    // Soft delete fields
    isDeleted: boolean('is_deleted').default(false).notNull(),
    deletedAt: timestamp('deleted_at'),
    // Audit fields for record tracking
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    // Unique constraint - email should be unique only among non-deleted users
    uniqueIndex('users_email_unique_idx')
      .on(table.email)
      .where(sql`${table.isDeleted} = false`),
  ],
);
