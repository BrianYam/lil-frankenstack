import { AuthService } from './auth.service';
import { ApiClient } from './api-client';
import {
  User,
  CreateUserRequest,
  DeleteUserResponse,
  UpdateUserRequest,
  UserWithDetails,
  ApiEndpoints,
} from './types';

/**
 * Users Service
 * Handles user management API requests
 */
export class UsersService {
  private readonly baseUrl: string;
  private readonly authService: AuthService;
  private readonly apiClient: ApiClient;
  private readonly apiEndpoints: ApiEndpoints;

  /**
   * Creates a new instance of UsersService
   * @param authService - Auth service instance for token management
   * @param apiEndpoints - API endpoints configuration
   * @param apiUrl - Base URL for API requests
   */
  constructor(
    authService: AuthService,
    apiEndpoints: ApiEndpoints,
    apiUrl?: string
  ) {
    this.authService = authService;
    this.apiEndpoints = apiEndpoints;
    this.baseUrl = apiUrl ?? authService.getApiUrl();
    this.apiClient = this.authService.getApiClient();
  }

  /**
   * Creates a new user
   * @param userData - The user data to create
   * @returns Promise with the created user
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      return await this.apiClient.post<User>(
        this.apiEndpoints.USERS.BASE,
        userData
      );
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
      console.log('Fetching all users from:', this.apiEndpoints.USERS.BASE);
      return await this.apiClient.get<User[]>(this.apiEndpoints.USERS.BASE);
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
      return await this.apiClient.get<UserWithDetails>(
        this.apiEndpoints.USERS.ME
      );
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
      return await this.apiClient.patch<User>(
        this.apiEndpoints.USERS.BY_ID(userId),
        userData
      );
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
      return await this.apiClient.delete<DeleteUserResponse>(
        this.apiEndpoints.USERS.BY_ID(userId)
      );
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
