/**
 * Authentication related type definitions for the Waypoint application
 */

/**
 * Login request interface for email/password authentication
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Request for password reset
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Request to reset password with token
 */
export interface ResetPasswordRequest {
  token: string;
  password: string;
}

/**
 * Request to change password
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Request to verify email address
 */
export interface VerifyEmailRequest {
  token: string;
}

/**
 * Generic API response
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export enum AuthFormType {
  LOGIN = 'login',
  SIGNUP = 'signup',
}
