
import { AuthService } from './auth.service';
import { UsersService } from './users.service';

/**
 * API Services Factory
 * Creates instances of all API services with proper dependencies
 */
export class ApiServices {
  private static _authService: AuthService;
  private static _usersService: UsersService;
  
  /**
   * Gets the singleton AuthService instance
   * @param apiUrl - Optional API URL override
   * @returns AuthService instance
   */
  static getAuthService(apiUrl?: string): AuthService {
    if (!this._authService) {
      this._authService = new AuthService(apiUrl);
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
      this._usersService = new UsersService(authService, apiUrl);
    }
    return this._usersService;
  }

  /**
   * Reset all service instances
   * Useful for testing or when configuration changes
   */
  static resetServices(): void {
    this._authService = undefined as unknown as AuthService;
    this._usersService = undefined as unknown as UsersService;
  }
}

// Export service classes for direct import if needed
export { AuthService } from './auth.service';
export { UsersService } from './users.service';
