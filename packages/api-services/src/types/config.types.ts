export interface ApiConfig {
  BASE_URL: string;
  TIMEOUT: number;
  VERSION: string;
  COOKIES: {
    ACCESS_TOKEN: string;
  };
  HEADERS: {
    CONTENT_TYPE: string;
    AUTHORIZATION: string;
    API_KEY_HEADER: string;
  };
  API_KEY: string;
}

export interface ApiEndpoints {
  AUTH: {
    LOGIN: string;
    REFRESH: string;
    LOGOUT: string;
    GOOGLE_LOGIN: string;
    COMPLETE_OAUTH: string;
    PASSWORD: {
      FORGOT: string;
      RESET: string;
      CHANGE: string;
    };
    EMAIL: {
      VERIFY: string;
    };
  };
  USERS: {
    BASE: string;
    ME: string;
    BY_ID: (id: string) => string;
  };
  USER_DETAILS: {
    BASE: string;
    BY_ID: (id: string) => string;
    DEFAULT: string;
    SET_DEFAULT: (id: string) => string;
  };
}

export interface AuthConfig {
  NON_AUTH_REDIRECT_URLS: string[];
}
