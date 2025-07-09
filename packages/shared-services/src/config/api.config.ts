/**
 * Shared API configuration interface and factory
 */
export interface ApiConfigOptions {
  baseUrl?: string;
  timeout?: number;
  version?: string;
  cookies?: {
    accessToken?: string;
  };
  headers?: {
    contentType?: string;
    authorization?: string;
    apiKeyHeader?: string;
  };
  apiKey?: string;
}

/**
 * Default API configuration
 */
export const DEFAULT_API_CONFIG = {
  BASE_URL: 'http://localhost:4001/api',
  TIMEOUT: 30000,
  VERSION: 'v1',
  COOKIES: {
    ACCESS_TOKEN: 'Authentication-fe',
  },
  HEADERS: {
    CONTENT_TYPE: 'application/json',
    AUTHORIZATION: 'Authorization',
    API_KEY_HEADER: 'frankenstack-api-key',
  },
  API_KEY: '',
};

/**
 * API configuration factory
 * Creates configuration object with defaults and overrides
 */
export function createApiConfig(options: ApiConfigOptions = {}) {
  return {
    BASE_URL: options.baseUrl ?? DEFAULT_API_CONFIG.BASE_URL,
    TIMEOUT: options.timeout ?? DEFAULT_API_CONFIG.TIMEOUT,
    VERSION: options.version ?? DEFAULT_API_CONFIG.VERSION,
    COOKIES: {
      ACCESS_TOKEN: options.cookies?.accessToken ?? DEFAULT_API_CONFIG.COOKIES.ACCESS_TOKEN,
    },
    HEADERS: {
      CONTENT_TYPE: options.headers?.contentType ?? DEFAULT_API_CONFIG.HEADERS.CONTENT_TYPE,
      AUTHORIZATION: options.headers?.authorization ?? DEFAULT_API_CONFIG.HEADERS.AUTHORIZATION,
      API_KEY_HEADER: options.headers?.apiKeyHeader ?? DEFAULT_API_CONFIG.HEADERS.API_KEY_HEADER,
    },
    API_KEY: options.apiKey ?? DEFAULT_API_CONFIG.API_KEY,
  };
}

/**
 * API endpoints configuration
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
