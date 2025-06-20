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
 * User interface representing a user in the system
 * Contains all user related data returned from the API
 */
export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface representing the input data for creating a new user
 */
export interface CreateUserRequest {
  email: string;
  password: string;
  role?: UserRole;
}

/**
 * Interface representing the input data for updating a user
 */
export interface UpdateUserRequest {
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string; //TODO to remove
}

/**
 * Interface representing the response when deleting a user
 */
export interface DeleteUserResponse {
  success: boolean;
  message: string;
  deletedUsers?: User[];
}
