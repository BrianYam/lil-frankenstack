/**
 * Constants for authentication strategy names
 * Used throughout the application for passport strategies
 */
export enum AUTH_STRATEGY {
  JWT_REFRESH = 'jwt-refresh',
  PASSPORT_LOCAL_EMAIL = 'passport-local-email',
  USER_EMAIL_JWT = 'user-email-jwt',
  GOOGLE_OAUTH = 'google-oauth',
}

export type TokenPayload = { userId: string };
