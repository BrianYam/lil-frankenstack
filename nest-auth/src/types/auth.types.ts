/**
 * Constants for authentication strategy names
 * Used throughout the application for passport strategies
 */
export enum AUTH_STRATEGY {
  JWT_REFRESH = 'jwt-refresh',
  PASSPORT_LOCAL_EMAIL = 'passport-local-email',
  USER_EMAIL_JWT = 'user-email-jwt',
}

export type AuthInput = { username: string; password: string };
export type SignInData = { username: string; userId: number };
export type AuthResult = {
  accessToken: string;
  userId: number;
  userName: string;
};

export type TokenPayload = { userId: string };
