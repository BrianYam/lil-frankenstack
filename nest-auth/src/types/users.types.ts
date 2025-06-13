// Type inference helpers for TypeScript
import { usersTable } from '@/database/schema';

export type User = typeof usersTable.$inferSelect; // Return type when querying the table
export type NewUser = typeof usersTable.$inferInsert; // Input type when inserting into the table
