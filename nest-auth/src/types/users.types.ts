// Type inference helpers for TypeScript
import { users } from '@/database/schema';

export type User = typeof users.$inferSelect; // Return type when querying the table
export type NewUser = typeof users.$inferInsert; // Input type when inserting into the table
