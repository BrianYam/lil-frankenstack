import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { UserDetailsService } from './user-details.service';
import {
  TokenRefreshCallback,
  TokenRefreshFailureCallback,
} from './api-client';
import { ApiConfigOptions } from './config';

/**
 * API Services Factory
 * Creates instances of all API services with proper token refresh handling
 */
export class ApiServices {
  private static readonly instances = new Map<string, any>();

  /**
   * Gets the singleton AuthService instance
   */
  static getAuthService(configOptions: ApiConfigOptions = {}): AuthService {
    const key = 'auth';
    if (!this.instances.has(key)) {
      this.instances.set(key, new AuthService(configOptions));
    }
    return this.instances.get(key);
  }

  /**
   * Gets the singleton UsersService instance with token refresh capability
   */
  static getUsersService(configOptions: ApiConfigOptions = {}): UsersService {
    const key = 'users';
    if (!this.instances.has(key)) {
      // Get or create the AuthService to use for token refresh
      const authService = this.getAuthService(configOptions);
      const tokenRefreshCallback: TokenRefreshCallback = () =>
        authService.refreshTokens();
      const tokenRefreshFailureCallback: TokenRefreshFailureCallback = () =>
        authService.handleTokenRefreshFailure();

      this.instances.set(
        key,
        new UsersService(
          configOptions,
          tokenRefreshCallback,
          tokenRefreshFailureCallback,
        ),
      );
    }
    return this.instances.get(key);
  }

  /**
   * Gets the singleton UserDetailsService instance with token refresh capability
   */
  static getUserDetailsService(
    configOptions: ApiConfigOptions = {},
  ): UserDetailsService {
    const key = 'userDetails';
    if (!this.instances.has(key)) {
      // Get or create the AuthService to use for token refresh
      const authService = this.getAuthService(configOptions);
      const tokenRefreshCallback: TokenRefreshCallback = () =>
        authService.refreshTokens();
      const tokenRefreshFailureCallback: TokenRefreshFailureCallback = () =>
        authService.handleTokenRefreshFailure();

      this.instances.set(
        key,
        new UserDetailsService(
          configOptions,
          tokenRefreshCallback,
          tokenRefreshFailureCallback,
        ),
      );
    }
    return this.instances.get(key);
  }

  /**
   * Reset all service instances
   * Useful for testing or when configuration changes
   */
  static resetServices(): void {
    this.instances.clear();
  }
}

// Export service classes for direct import if needed
export { AuthService } from './auth.service';
export { UsersService } from './users.service';
export { UserDetailsService } from './user-details.service';
export { ApiClient } from './api-client';

// Export config
export * from './config';
