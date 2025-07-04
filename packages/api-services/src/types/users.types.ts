/**
 * Enum representing user roles in the application
 * Used to control access to different features and permissions
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  USER = 'USER',
}

export interface User {
  id: string;
  email: string;
  isActive: boolean;
  isEmailVerified: boolean;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface UserDetails {
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
}

export interface UserWithDetails extends User {
  details?: UserDetails[];
  defaultDetails?: UserDetails;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  email?: string;
  isActive?: boolean;
  role?: UserRole;
}

export interface CreateUserDetailsRequest {
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
}

export interface UpdateUserDetailsRequest {
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  mobileNumber?: string;
  isDefault?: boolean;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
  deletedUsers?: User[];
}
