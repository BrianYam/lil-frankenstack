import {
  ApiServices,
  AuthService,
  UsersService,
  UserDetailsService,
  ApiConfigOptions,
  DEFAULT_API_CONFIG
} from '@lil-frankenstack/shared-services';

// Create configuration from environment variables
const apiConfig: ApiConfigOptions = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4001/api',
  apiKey: process.env.NEXT_PUBLIC_AUTH_API_KEY ?? '',
  cookies: {
    accessToken: DEFAULT_API_CONFIG.COOKIES.ACCESS_TOKEN
  },
};

/**
 * API Services Factory for Waypoint App
 * Creates instances of all API services with proper configuration
 */
export class WaypointApiServices {
  /**
   * Gets the singleton AuthService instance
   */
  static getAuthService(): AuthService {
    return ApiServices.getAuthService(apiConfig);
  }
  
  /**
   * Gets the singleton UsersService instance
   */
  static getUsersService(): UsersService {
    return ApiServices.getUsersService(apiConfig);
  }

  /**
   * Gets the singleton UserDetailsService instance
   */
  static getUserDetailsService(): UserDetailsService {
    return ApiServices.getUserDetailsService(apiConfig);
  }

  /**
   * Reset all service instances
   */
  static resetServices(): void {
    ApiServices.resetServices();
  }
}

// Export service classes for direct import if needed
export { AuthService, UsersService, UserDetailsService } from '@lil-frankenstack/shared-services';

// For backward compatibility, export the services factory as default
export { WaypointApiServices as ApiServices };
