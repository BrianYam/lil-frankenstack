import axios from 'axios';
import Cookies from 'js-cookie';
import { ApiClient } from './api-client';
import {
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
  ApiResponse,
  ApiConfig,
  ApiEndpoints,
  AuthConfig,
} from './types';

const AUTHENTICATED = 'authenticated';

/**
 * Auth Service
 * Handles authentication-related API requests and token management
 */
export class AuthService {
  private readonly baseUrl: string;
  private readonly accessTokenKey: string;
  private readonly apiConfig: ApiConfig;
  private readonly apiEndpoints: ApiEndpoints;
  private readonly authConfig: AuthConfig;
  private apiClient?: ApiClient;

  /**
   * Creates a new instance of AuthService
   * @param apiConfig - API configuration
   * @param apiEndpoints - API endpoints configuration
   * @param authConfig - Auth configuration
   * @param apiUrl - Base URL for API requests
   */
  constructor(
    apiConfig: ApiConfig,
    apiEndpoints: ApiEndpoints,
    authConfig: AuthConfig,
    apiUrl?: string
  ) {
    this.apiConfig = apiConfig;
    this.apiEndpoints = apiEndpoints;
    this.authConfig = authConfig;
    this.baseUrl = apiUrl ?? apiConfig.BASE_URL;
    this.accessTokenKey = apiConfig.COOKIES.ACCESS_TOKEN;
  }

  /**
   * Get the API client instance
   * @returns ApiClient instance
   */
  getApiClient(): ApiClient {
    this.apiClient ??= new ApiClient(
      this,
      this.apiConfig,
      this.apiEndpoints,
      this.authConfig,
      this.baseUrl
    );
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
   */
  async login(credentials: LoginRequest): Promise<void> {
    console.log(`Logging in with credentials: ${JSON.stringify(credentials)}`);
    try {
      // Use a temporary API client that has the API key interceptor
      const tempClient = new ApiClient(
        this,
        this.apiConfig,
        this.apiEndpoints,
        this.authConfig,
        this.baseUrl
      );

      // Backend doesn't return any body, just sets HTTP-only cookies
      await tempClient.post(this.apiEndpoints.AUTH.LOGIN, credentials);

      // Set a client-side marker for auth state tracking
      this.setAccessToken(AUTHENTICATED);
    } catch (error) {
      this.handleError('Login failed', error);
      throw error; // Re-throw so the calling code can handle it
    }
  }

  /**
   * Refreshes the authentication tokens
   */
  async refreshTokens(): Promise<void> {
    try {
      // Use a temporary API client that has the API key interceptor
      const tempClient = new ApiClient(
        this,
        this.apiConfig,
        this.apiEndpoints,
        this.authConfig,
        this.baseUrl
      );

      // Backend doesn't return any body, just refreshes HTTP-only cookies
      await tempClient.post(this.apiEndpoints.AUTH.REFRESH, {});

      // Reset client-side marker for auth state tracking
      this.setAccessToken(AUTHENTICATED);
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
      await this.getApiClient().post(this.apiEndpoints.AUTH.LOGOUT, {});
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
  async requestPasswordReset(
    data: ForgotPasswordRequest
  ): Promise<ApiResponse> {
    try {
      return await this.getApiClient().post<ApiResponse>(
        this.apiEndpoints.AUTH.PASSWORD.FORGOT,
        data
      );
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
      return await this.getApiClient().post<ApiResponse>(
        this.apiEndpoints.AUTH.PASSWORD.RESET,
        data
      );
    } catch (error) {
      this.handleError('Password reset failed', error);
      throw error;
    }
  }

  /**
   * Changes the user's password
   * @param data - Contains the current password and new password
   * @returns Promise with the API response
   */
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse> {
    try {
      return await this.getApiClient().post<ApiResponse>(
        this.apiEndpoints.AUTH.PASSWORD.CHANGE,
        data
      );
    } catch (error) {
      this.handleError('Password change failed', error);
      throw error;
    }
  }

  /**
   * Verifies a user's email with the provided token
   * @param data - Contains the verification token
   * @returns Promise with the API response
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<ApiResponse> {
    try {
      return await this.getApiClient().post<ApiResponse>(
        this.apiEndpoints.AUTH.EMAIL.VERIFY,
        data
      );
    } catch (error) {
      this.handleError('Email verification failed', error);
      throw error;
    }
  }

  /**
   * Initiates Google OAuth login
   * Uses the Next.js API as a proxy to securely add the API key to the request
   */
  googleLogin(): void {
    window.location.href = `${this.baseUrl}${this.apiEndpoints.AUTH.GOOGLE_LOGIN}`;
  }

  /**
   * Checks if the user is authenticated
   * @returns Boolean indicating if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!Cookies.get(this.accessTokenKey);
  }

  /**
   * Completes the OAuth authentication process after redirect
   * @param token - The temporary token received in the URL hash
   * @returns Promise with the API response
   */
  async completeOAuthAuthentication(token: string): Promise<ApiResponse> {
    try {
      const response = await this.getApiClient().post<ApiResponse>(
        this.apiEndpoints.AUTH.COMPLETE_OAUTH,
        { token }
      );

      // Set a client-side marker for auth state tracking
      this.setAccessToken(AUTHENTICATED);

      return response;
    } catch (error) {
      this.handleError('OAuth authentication completion failed', error);
      throw error;
    }
  }

  // Private methods

  /**
   * Sets a marker cookie to track authentication state client-side
   * @param token - The token value
   */
  private setAccessToken(token: string): void {
    Cookies.set(this.accessTokenKey, token, { path: '/', sameSite: 'strict' });
  }

  /**
   * Clears authentication token markers
   * The actual secure tokens are cleared by the server
   */
  private clearTokens(): void {
    Cookies.remove(this.accessTokenKey, { path: '/' });
  }

  /**
   * Handles API errors
   * @param message - Custom error message
   * @param error - The error object
   */
  private handleError(message: string, error: unknown): void {
    // Extract the error message from axios error if available
    let errorMessage = message;
    if (axios.isAxiosError(error) && error.response) {
      const serverError = error.response.data;
      errorMessage =
        serverError?.message ?? `${message} (${error.response.status})`;
    }

    console.error(`${errorMessage}:`, error);
  }
}
