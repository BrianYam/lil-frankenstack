import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { UserDetailsService } from './user-details.service';
import { ApiClient } from './api-client';
import { ApiConfig, ApiEndpoints, AuthConfig } from './types';
import { API_CONFIG, API_ENDPOINTS, AUTH_CONFIG } from './config';

/**
 * API Services Factory
 * Creates instances of all API services with proper dependencies
 */
export class ApiServices {
  private static _authService: AuthService;
  private static _usersService: UsersService;
  private static _userDetailsService: UserDetailsService;
  private static _initialized = false;

  /**
   * Initialize the API services with default configuration
   * This uses the built-in configuration from the package
   */
  static initialize(): void {
    this._initialized = true;
  }

  /**
   * Initialize the API services with custom configuration
   * @param apiConfig - API configuration
   * @param apiEndpoints - API endpoints configuration
   * @param authConfig - Auth configuration
   */
  static initializeWithConfig(
    apiConfig: ApiConfig,
    apiEndpoints: ApiEndpoints,
    authConfig: AuthConfig
  ): void {
    // Store custom config if needed in the future
    this._initialized = true;
  }

  /**
   * Gets the singleton AuthService instance
   * @param apiUrl - Optional API URL override
   * @returns AuthService instance
   */
  static getAuthService(apiUrl?: string): AuthService {
    if (!this._initialized) {
      this.initialize();
    }

    if (!this._authService) {
      this._authService = new AuthService(
        API_CONFIG,
        API_ENDPOINTS,
        AUTH_CONFIG,
        apiUrl
      );
    }
    return this._authService;
  }

  /**
   * Gets the singleton UsersService instance
   * @param apiUrl - Optional API URL override
   * @returns UsersService instance
   */
  static getUsersService(apiUrl?: string): UsersService {
    if (!this._usersService) {
      const authService = this.getAuthService(apiUrl);
      this._usersService = new UsersService(authService, API_ENDPOINTS, apiUrl);
    }
    return this._usersService;
  }

  /**
   * Gets the singleton UserDetailsService instance
   * @param apiUrl - Optional API URL override
   * @returns UserDetailsService instance
   */
  static getUserDetailsService(apiUrl?: string): UserDetailsService {
    if (!this._userDetailsService) {
      const authService = this.getAuthService(apiUrl);
      this._userDetailsService = new UserDetailsService(
        authService,
        API_ENDPOINTS,
        apiUrl
      );
    }
    return this._userDetailsService;
  }

  /**
   * Reset all service instances
   * Useful for testing or when configuration changes
   */
  static resetServices(): void {
    this._authService = undefined as unknown as AuthService;
    this._usersService = undefined as unknown as UsersService;
    this._userDetailsService = undefined as unknown as UserDetailsService;
    this._initialized = false;
  }
}

// Export service classes for direct import if needed
export { AuthService } from './auth.service';
export { UsersService } from './users.service';
export { UserDetailsService } from './user-details.service';
export { ApiClient } from './api-client';

// Export configurations
export { API_CONFIG, API_ENDPOINTS, AUTH_CONFIG } from './config';

// Export all types
export * from './types';
