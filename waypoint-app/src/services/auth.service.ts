// filepath: /Users/brianyam/Documents/BrianLabProject/lil-frankenstack/waypoint-app/src/services/auth.service.ts

import axios from 'axios';
import Cookies from 'js-cookie';
import { 
  LoginRequest,
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ApiResponse 
} from '@/types/auth.types';
import { ApiClient } from './api-client';
import { API_CONFIG, API_ENDPOINTS } from '@/config/api.config';

/**
 * Auth Service
 * Handles authentication-related API requests and token management
 */
export class AuthService {
  private baseUrl: string;
  private accessTokenKey = API_CONFIG.COOKIES.ACCESS_TOKEN;
  private refreshTokenKey = API_CONFIG.COOKIES.REFRESH_TOKEN;
  private apiClient?: ApiClient;

  /**
   * Creates a new instance of AuthService
   * @param apiUrl - Base URL for API requests
   */
  constructor(apiUrl?: string) {
    this.baseUrl = apiUrl || API_CONFIG.BASE_URL;
  }
  
  /**
   * Get the API client instance
   * @returns ApiClient instance
   */
  getApiClient(): ApiClient {
    if (!this.apiClient) {
      this.apiClient = new ApiClient(this, this.baseUrl);
    }
    return this.apiClient;
  }

  /**
   * Get the configured API URL
   * @returns The base URL for API calls
   */
  getApiUrl(): string {
    return this.baseUrl;
  }

  /**
   * Logs in a user with email and password
   * @param credentials - The login credentials (email and password)
   * @returns Promise with the authentication response
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(
        `${this.baseUrl}${API_ENDPOINTS.AUTH.LOGIN}`,
        credentials,
        { withCredentials: true }  // Essential for cookie-based auth
      );

      // Set client-side authentication markers
      // The actual secure tokens are set by the server as HTTP-only cookies
      // This is just for client-side state tracking
      if (response.data.accessToken) {
        this.setAccessToken(response.data.accessToken);
      }
      if (response.data.refreshToken) {
        this.setRefreshToken(response.data.refreshToken);
      }

      return response.data;
    } catch (error) {
      this.handleError('Login failed', error);
      throw error;
    }
  }

  /**
   * Refreshes the authentication tokens
   * @returns Promise with the new authentication response
   */
  async refreshTokens(): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(
        `${this.baseUrl}${API_ENDPOINTS.AUTH.REFRESH}`,
        {},
        { withCredentials: true }
      );

      // Store tokens if they're returned directly
      if (response.data.accessToken) {
        this.setAccessToken(response.data.accessToken);
      }
      
      return response.data;
    } catch (error) {
      this.logout();
      this.handleError('Token refresh failed', error);
      throw error;
    }
  }

  /**
   * Logs out the current user
   * @returns Promise indicating success
   */
  async logout(): Promise<void> {
    try {
      await this.getApiClient().post(API_ENDPOINTS.AUTH.LOGOUT, {});
      this.clearTokens();
    } catch (error) {
      // Still clear tokens locally even if API call fails
      this.clearTokens();
      this.handleError('Logout failed', error);
    }
  }

  /**
   * Requests a password reset for the specified email
   * @param data - Contains the email address
   * @returns Promise with the API response
   */
  async requestPasswordReset(data: ForgotPasswordRequest): Promise<ApiResponse> {
    try {
      return await this.getApiClient().post<ApiResponse>(API_ENDPOINTS.AUTH.PASSWORD.FORGOT, data);
    } catch (error) {
      this.handleError('Password reset request failed', error);
      throw error;
    }
  }

  /**
   * Resets a password using a token
   * @param data - Contains the reset token and new password
   * @returns Promise with the API response
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse> {
    try {
      return await this.getApiClient().post<ApiResponse>(API_ENDPOINTS.AUTH.PASSWORD.RESET, data);
    } catch (error) {
      this.handleError('Password reset failed', error);
      throw error;
    }
  }

  /**
   * Initiates Google OAuth login
   */
  googleLogin(): void {
    window.location.href = `${this.baseUrl}${API_ENDPOINTS.AUTH.GOOGLE_LOGIN}`;
  }

  /**
   * Checks if the user is authenticated
   * @returns Boolean indicating if user is authenticated
   * 
   * Note: This doesn't check the actual token as we're using cookie-based auth.
   * Instead, it relies on the presence of the cookie which the browser will
   * automatically send with requests when withCredentials is true.
   */
  isAuthenticated(): boolean {
    return !!Cookies.get(this.accessTokenKey);
  }

  // Private methods

  /**
   * Note on token storage:
   * Our backend uses HTTP-only cookies for authentication tokens.
   * These methods are now primarily for client-side detection of authentication state.
   * The actual secure tokens are managed by the server via HTTP-only cookies.
   */

  /**
   * Sets a marker cookie to track authentication state client-side
   * @param token - The token value
   */
  private setAccessToken(token: string): void {
    Cookies.set(this.accessTokenKey, token, { path: '/', sameSite: 'strict' });
  }

  /**
   * Sets the refresh token cookie marker
   * @param token - The token value
   */
  private setRefreshToken(token: string): void {
    Cookies.set(this.refreshTokenKey, token, { path: '/', sameSite: 'strict' });
  }

  /**
   * Clears authentication token markers
   * The actual secure tokens are cleared by the server
   */
  private clearTokens(): void {
    Cookies.remove(this.accessTokenKey, { path: '/' });
    Cookies.remove(this.refreshTokenKey, { path: '/' });
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