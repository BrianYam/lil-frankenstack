import { ApiClient, TokenRefreshCallback, TokenRefreshFailureCallback } from './api-client';
import {
  UserDetails,
  CreateUserDetailsRequest,
  UpdateUserDetailsRequest
} from './types';
import { API_ENDPOINTS, ApiConfigOptions } from './config';

/**
 * User Details Service
 * Handles user details management API requests
 */
export class UserDetailsService {
  private readonly apiClient: ApiClient;

  /**
   * Creates a new instance of UserDetailsService
   * @param configOptions - Configuration options for the API client
   * @param tokenRefreshCallback - Optional callback for token refresh
   * @param tokenRefreshFailureCallback - Optional callback for token refresh failure
   */
  constructor(
    configOptions: ApiConfigOptions = {},
    tokenRefreshCallback?: TokenRefreshCallback,
    tokenRefreshFailureCallback?: TokenRefreshFailureCallback
  ) {
    this.apiClient = new ApiClient(configOptions, tokenRefreshCallback, tokenRefreshFailureCallback);
  }

  /**
   * Creates new user details
   * @param userDetailsData - The user details data to create
   * @returns Promise with the created user details
   */
  async create(userDetailsData: CreateUserDetailsRequest): Promise<UserDetails> {
    try {
      return await this.apiClient.post<UserDetails>(API_ENDPOINTS.USER_DETAILS.BASE, userDetailsData);
    } catch (error) {
      this.handleError('Failed to create user details', error);
      throw error;
    }
  }

  /**
   * Gets all user details for the current user
   * @returns Promise with array of user details
   */
  async getAllUserDetails(): Promise<UserDetails[]> {
    try {
      return await this.apiClient.get<UserDetails[]>(API_ENDPOINTS.USER_DETAILS.BASE);
    } catch (error) {
      this.handleError('Failed to fetch all user details', error);
      throw error;
    }
  }

  /**
   * Gets the default user details for the current user
   * @returns Promise with the default user details
   */
  async getDefaultUserDetails(): Promise<UserDetails> {
    try {
      return await this.apiClient.get<UserDetails>(API_ENDPOINTS.USER_DETAILS.DEFAULT);
    } catch (error) {
      this.handleError('Failed to fetch default user details', error);
      throw error;
    }
  }

  /**
   * Gets user details by ID
   * @param id - The ID of the user details to retrieve
   * @returns Promise with the user details
   */
  async getUserDetailsById(id: string): Promise<UserDetails> {
    try {
      return await this.apiClient.get<UserDetails>(API_ENDPOINTS.USER_DETAILS.BY_ID(id));
    } catch (error) {
      this.handleError(`Failed to fetch user details with ID ${id}`, error);
      throw error;
    }
  }

  /**
   * Updates user details by ID
   * @param id - The ID of the user details to update
   * @param userDetailsData - The user details data to update
   * @returns Promise with the updated user details
   */
  async updateUserDetails(id: string, userDetailsData: UpdateUserDetailsRequest): Promise<UserDetails> {
    try {
      return await this.apiClient.patch<UserDetails>(API_ENDPOINTS.USER_DETAILS.BY_ID(id), userDetailsData);
    } catch (error) {
      this.handleError(`Failed to update user details with ID ${id}`, error);
      throw error;
    }
  }

  /**
   * Sets a specific user detail as default
   * @param id - The ID of the user details to set as default
   * @returns Promise with the updated user details
   */
  async setDefaultUserDetails(id: string): Promise<UserDetails> {
    try {
      return await this.apiClient.patch<UserDetails>(API_ENDPOINTS.USER_DETAILS.SET_DEFAULT(id), {});
    } catch (error) {
      this.handleError(`Failed to set default user details with ID ${id}`, error);
      throw error;
    }
  }

  /**
   * Deletes user details by ID
   * @param id - The ID of the user details to delete
   * @returns Promise with the deleted user details
   */
  async deleteUserDetails(id: string): Promise<UserDetails> {
    try {
      return await this.apiClient.delete<UserDetails>(API_ENDPOINTS.USER_DETAILS.BY_ID(id));
    } catch (error) {
      this.handleError(`Failed to delete user details with ID ${id}`, error);
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
