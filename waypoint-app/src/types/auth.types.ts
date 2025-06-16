// filepath: /Users/brianyam/Documents/BrianLabProject/lil-frankenstack/waypoint-app/src/types/auth.types.ts

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
 * Generic API response
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}
