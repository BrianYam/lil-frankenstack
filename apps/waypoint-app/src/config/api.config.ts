/**
 * API configuration
 */
export const API_CONFIG = {
  /**
   * Base URL for API requests
   * Falls back to localhost if environment variable is not set
   */
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4001/api',
  
  /**
   * Default timeout for API requests in milliseconds
   */
  TIMEOUT: 30000,
  
  /**
   * API version
   */
  VERSION: 'v1',
  
  /**
   * Cookie names for authentication
   */
  COOKIES: {
    ACCESS_TOKEN: 'Authentication-fe',
  },
  
  /**
   * Headers
   */
  HEADERS: {
    CONTENT_TYPE: 'application/json',
    AUTHORIZATION: 'Authorization',
    API_KEY_HEADER: 'frankenstack-api-key',
  },

  /**
   * API key for authentication with the backend
   * Falls back to an empty string which will fail if not provided
   */
  API_KEY: process.env.NEXT_PUBLIC_AUTH_API_KEY ?? '',
};  /**
   * API endpoints
   */
  export const API_ENDPOINTS = {
    AUTH: {
      LOGIN: '/auth/login/email',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
      GOOGLE_LOGIN: '/auth/google/login',
      COMPLETE_OAUTH: '/auth/complete-oauth',
      PASSWORD: {
        FORGOT: '/auth/password/forgot',
        RESET: '/auth/password/reset',
        CHANGE: '/auth/password/change',
      },
      EMAIL: {
        VERIFY: '/auth/email/verify',
      }
    },
  USERS: {
    BASE: '/users',
    ME: '/users/me',
    BY_ID: (id: string) => `/users/${id}`
  },
  USER_DETAILS: {
    BASE: '/users/details',
    BY_ID: (id: string) => `/users/details/${id}`,
    DEFAULT: '/users/details/default',
    SET_DEFAULT: (id: string) => `/users/details/${id}/set-default`,
  }
};
