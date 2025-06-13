import {
  timestamp,
  pgTable,
  text,
  boolean,
  uuid,
  json,
} from 'drizzle-orm/pg-core';

export const apiKeysTable = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(), // Name of the API key
  description: text('description'), // Description of what this key is used for
  key: text('key').notNull(), // Hashed API key
  clientName: text('client_name').notNull(), // Which client/service this key belongs to
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'), // Optional expiration date
  isActive: boolean('is_active').default(true).notNull(),
  lastUsedAt: timestamp('last_used_at'), // Track when the key was last used
  permissions: json('permissions').$type<string[]>().default([]), // Specific permissions this key grants
  userId: uuid('user_id').notNull(), // User who created the key
});
