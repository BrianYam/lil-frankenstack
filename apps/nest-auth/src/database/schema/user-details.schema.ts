import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  uuid,
  timestamp,
  boolean,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { usersTable } from './users.schema';

/**
 * User Details table schema
 * Stores additional user profile information
 */
export const userDetailsTable = pgTable(
  'user_details',
  {
    id: uuid('id').defaultRandom().notNull().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    addressLine1: text('address_line_1').notNull(),
    addressLine2: text('address_line_2'),
    city: text('city').notNull(),
    state: text('state').notNull(),
    postalCode: text('postal_code').notNull(),
    country: text('country').notNull(), //TODO make this a enum
    // TODO country iso
    mobileNumber: text('mobile_number').notNull(), //TODO this is the best approach to store phone numbers ?
    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_details_user_id_is_default_idx')
      .on(table.userId, table.isDefault)
      .where(sql`${table.isDefault} = true`),
  ],
);

export const userDetailsRelations = relations(userDetailsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userDetailsTable.userId],
    references: [usersTable.id],
  }),
}));
