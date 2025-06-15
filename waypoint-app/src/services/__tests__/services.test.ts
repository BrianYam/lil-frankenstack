
/**
 * This is a basic test file for the API services
 * You can extend these tests or create more specific test files
 */

import { ApiServices } from '@/services';
import { API_CONFIG } from '@/config/api.config';

describe('API Services', () => {
  const mockApiUrl = 'http://test-api.local';
  
  beforeEach(() => {
    // Reset services before each test
    ApiServices.resetServices();
  });
  
  describe('AuthService', () => {
    it('should be created with the correct base URL', () => {
      const authService = ApiServices.getAuthService(mockApiUrl);
      expect(authService.getApiUrl()).toBe(mockApiUrl);
    });
    
    it('should use the default API URL if none provided', () => {
      const authService = ApiServices.getAuthService();
      expect(authService.getApiUrl()).toBe(API_CONFIG.BASE_URL);
    });
  });
  
  describe('UsersService', () => {
    it('should be created with the auth service dependency', () => {
      const usersService = ApiServices.getUsersService(mockApiUrl);
      // The users service is created and should have its methods
      expect(usersService.createUser).toBeDefined();
      expect(usersService.getAllUsers).toBeDefined();
      expect(usersService.getCurrentUser).toBeDefined();
      expect(usersService.deleteUser).toBeDefined();
    });
  });
});
