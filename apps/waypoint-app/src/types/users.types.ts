/**
 * User related type definitions for the Waypoint application
 * These types are used in the frontend to interact with the backend API
 */

/**
 * Enum representing user roles in the application
 * Used to control access to different features and permissions
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  USER = 'USER',
}

/**
 * User type representing a user in the system
 * Contains all user related data returned from the API
 */
export type User = {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Type representing the input data for creating a new user
 */
export type CreateUserRequest = {
  email: string;
  password: string;
  role?: UserRole;
};

/**
 * Type representing the input data for updating a user
 */
export type UpdateUserRequest = {
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string; //TODO to remove
};

/**
 * Type representing the response when deleting a user
 */
export type DeleteUserResponse = {
  success: boolean;
  message: string;
  deletedUsers?: User[];
};

/**
 * User details type matching the nest-auth schema
 */
export type UserDetails = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  mobileNumber: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * User with details type
 */
export type UserWithDetails = User & {
  details?: UserDetails[];
  defaultDetails?: UserDetails;
};

/**
 * Type representing the input data for creating new user details
 */
export type CreateUserDetailsRequest = {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  mobileNumber: string;
  isDefault?: boolean;
};

/**
 * Type representing the input data for updating user details
 */
export type UpdateUserDetailsRequest = Partial<CreateUserDetailsRequest>;
