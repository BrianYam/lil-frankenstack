// filepath: /Users/brianyam/Documents/BrianLabProject/lil-frankenstack/waypoint-app/src/services/users.service.ts

import { AuthService } from './auth.service';
import { ApiClient } from './api-client';
import { API_CONFIG, API_ENDPOINTS } from '@/config/api.config';
import { 
  User, 
  CreateUserRequest, 
  DeleteUserResponse,
  UpdateUserRequest,
  UserWithDetails
} from '@/types/users.types';

/**
 * Users Service
 * Handles user management API requests
 */
export class UsersService {
  private readonly baseUrl: string;
  private readonly authService: AuthService;
  private readonly apiClient: ApiClient;

  /**
   * Creates a new instance of UsersService
   * @param authService - Auth service instance for token management
   * @param apiUrl - Base URL for API requests
   */
  constructor(authService: AuthService, apiUrl?: string) {
    this.authService = authService;
    this.baseUrl = apiUrl ?? API_CONFIG.BASE_URL;
    this.apiClient = this.authService.getApiClient();
  }

  /**
   * Creates a new user
   * @param userData - The user data to create
   * @returns Promise with the created user
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      return await this.apiClient.post<User>(API_ENDPOINTS.USERS.BASE, userData);
    } catch (error) {
      this.handleError('Failed to create user', error);
      throw error;
    }
  }

  /**
   * Gets all users
   * @returns Promise with array of users
   */
  async getAllUsers(): Promise<User[]> {
    try {
      console.log('Fetching all users from:', API_ENDPOINTS.USERS.BASE);
      return await this.apiClient.get<User[]>(API_ENDPOINTS.USERS.BASE);
    } catch (error) {
      this.handleError('Failed to fetch users', error);
      throw error;
    }
  }

  /**
   * Gets the current user profile
   * @returns Promise with the current user data
   */
  async getCurrentUser(): Promise<UserWithDetails> {
    try {
      return await this.apiClient.get<UserWithDetails>(API_ENDPOINTS.USERS.ME);
    } catch (error) {
      this.handleError('Failed to fetch current user', error);
      throw error;
    }
  }

  /**
   * Updates a user by ID
   * @param userId - The ID of the user to update
   * @param userData - The user data to update
   * @returns Promise with the updated user
   */
  async updateUser(userId: string, userData: UpdateUserRequest): Promise<User> {
    try {
      return await this.apiClient.patch<User>(API_ENDPOINTS.USERS.BY_ID(userId), userData);
    } catch (error) {
      this.handleError(`Failed to update user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Deletes a user by ID
   * @param userId - The ID of the user to delete
   * @returns Promise with deletion response
   */
  async deleteUser(userId: string): Promise<DeleteUserResponse> {
    try {
      return await this.apiClient.delete<DeleteUserResponse>(API_ENDPOINTS.USERS.BY_ID(userId));
    } catch (error) {
      this.handleError(`Failed to delete user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Handles API errors
   * @param message - Custom error message
   * @param error - The error object
   */
  private handleError(message: string, error: unknown): void {
    console.error(`${message}:`, error);
  }
}
