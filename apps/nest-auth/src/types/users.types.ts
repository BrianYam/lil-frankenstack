// Type inference helpers for TypeScript
import { usersTable, userDetailsTable } from '@/modules/database/schema';
export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  USER = 'USER',
}
export type User = typeof usersTable.$inferSelect; // Return type when querying the table
export type NewUser = typeof usersTable.$inferInsert; // Input type when inserting into the table

export type UserDetails = typeof userDetailsTable.$inferSelect; // Return type when querying the table
export type NewUserDetails = typeof userDetailsTable.$inferInsert; // Input type when inserting into the table

export type UserWithDetails = User & {
  details?: UserDetails[];
  defaultDetails?: UserDetails;
};

export type DeleteUserResponse = {
  success: boolean;
  message: string;
  deletedUsers?: User[];
};

export type GetUserQuery = {
  email?: string;
  id?: string;
};

export type FindUserDetailsParams = {
  id?: string;
  userId?: string;
  isDefault?: boolean;
};
