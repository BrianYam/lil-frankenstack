// Type inference helpers for TypeScript
import { usersTable } from '@/database/schema';
export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  USER = 'USER',
}
export type User = typeof usersTable.$inferSelect; // Return type when querying the table
export type NewUser = typeof usersTable.$inferInsert; // Input type when inserting into the table

export interface DeleteUserResponse {
  success: boolean;
  message: string;
  deletedUsers?: User[];
}
