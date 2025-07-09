/**
 * Authentication related type definitions for the Waypoint application
 */

/**
 * Login request type for email/password authentication
 */
export type LoginRequest = {
  email: string;
  password: string;
};

/**
 * Request for password reset
 */
export type ForgotPasswordRequest = {
  email: string;
};

/**
 * Request to reset password with token
 */
export type ResetPasswordRequest = {
  token: string;
  password: string;
};

/**
 * Request to change password
 */
export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

/**
 * Request to verify email address
 */
export type VerifyEmailRequest = {
  token: string;
};

/**
 * Generic API response
 */
export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

export enum AuthFormType {
  LOGIN = 'login',
  SIGNUP = 'signup',
}
