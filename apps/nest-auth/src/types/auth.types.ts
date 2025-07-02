/**
 * Constants for authentication strategy names
 * Used throughout the application for passport strategies
 */
export enum AUTH_STRATEGY {
  JWT_REFRESH = 'jwt-refresh',
  PASSPORT_LOCAL_EMAIL = 'passport-local-email',
  USER_AUTH_JWT = 'user-auth-jwt',
  GOOGLE_OAUTH = 'google-oauth',
}

export type TokenPayload = { userId: string };
