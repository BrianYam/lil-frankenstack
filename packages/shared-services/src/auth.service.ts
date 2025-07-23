import Cookies from 'js-cookie';
import { ApiClient } from './api-client';
import {
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
  ApiResponse,
} from '@lil-frankenstack/types';
import { API_ENDPOINTS, ApiConfigOptions, AUTH_CONFIG } from './config';
import { handleError } from './utils';

const AUTHENTICATED = 'authenticated';

/**
 * Auth Service
 * Handles authentication-related API requests and token management
 */
export class AuthService {
  private readonly apiClient: ApiClient;
  private readonly accessTokenKey: string;

  /**
   * Creates a new instance of AuthService
   * @param configOptions - Configuration options for the API client
   */
  constructor(configOptions: ApiConfigOptions = {}) {
    // Create ApiClient with token refresh callback and failure callback
    this.apiClient = new ApiClient(
      configOptions,
      () => this.refreshTokens(),
      () => this.handleTokenRefreshFailure(),
    );
    this.accessTokenKey = this.apiClient.getConfig().COOKIES.ACCESS_TOKEN;
  }

  /**
   * Get the API client instance
   */
  getApiClient(): ApiClient {
    return this.apiClient;
  }

  /**
   * Get the configured API URL
   */
  getApiUrl(): string {
    return this.apiClient.getBaseUrl();
  }

  /**
   * Logs in a user with email and password
   * Used via: WaypointApiServices.getAuthService().login() in waypoint-app
   */
  async login(credentials: LoginRequest): Promise<void> {
    try {
      // Backend doesn't return any response body, just sets HTTP-only cookies
      await this.apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);

      // Set a client-side marker for auth state tracking
      this.setAccessToken(AUTHENTICATED);
    } catch (error) {
      handleError('Login failed', error);
      throw error;
    }
  }

  /**
   * Refreshes the authentication tokens
   */
  async refreshTokens(): Promise<void> {
    try {
      // Backend doesn't return any response body, just refreshes HTTP-only cookies
      await this.apiClient.post(API_ENDPOINTS.AUTH.REFRESH, {});

      // Reset client-side marker for auth state tracking
      this.setAccessToken(AUTHENTICATED);
    } catch (error) {
      this.logout();
      handleError('Token refresh failed', error);
      throw error;
    }
  }

  /**
   * Logs out the current user
   */
  async logout(): Promise<void> {
    try {
      await this.apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {});
      this.clearTokens();
    } catch (error) {
      // Still clear tokens locally even if API call fails
      this.clearTokens();
      handleError('Logout failed', error);
    }
  }

  /**
   * Requests a password reset for the specified email
   */
  async requestPasswordReset(
    data: ForgotPasswordRequest,
  ): Promise<ApiResponse> {
    try {
      return await this.apiClient.post<ApiResponse>(
        API_ENDPOINTS.AUTH.PASSWORD.FORGOT,
        data,
      );
    } catch (error) {
      handleError('Password reset request failed', error);
      throw error;
    }
  }

  /**
   * Resets a password using a token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse> {
    try {
      return await this.apiClient.post<ApiResponse>(
        API_ENDPOINTS.AUTH.PASSWORD.RESET,
        data,
      );
    } catch (error) {
      handleError('Password reset failed', error);
      throw error;
    }
  }

  /**
   * Changes the user's password
   */
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse> {
    try {
      return await this.apiClient.post<ApiResponse>(
        API_ENDPOINTS.AUTH.PASSWORD.CHANGE,
        data,
      );
    } catch (error) {
      handleError('Password change failed', error);
      throw error;
    }
  }

  /**
   * Verifies a user's email with the provided token
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<ApiResponse> {
    try {
      return await this.apiClient.post<ApiResponse>(
        API_ENDPOINTS.AUTH.EMAIL.VERIFY,
        data,
      );
    } catch (error) {
      handleError('Email verification failed', error);
      throw error;
    }
  }

  /**
   * Completes the OAuth authentication process after redirect
   * @param token - The temporary token received in the URL hash
   * @returns Promise with the API response
   */
  async completeOAuthAuthentication(token: string): Promise<ApiResponse> {
    try {
      const response = await this.getApiClient().post<ApiResponse>(
        API_ENDPOINTS.AUTH.COMPLETE_OAUTH,
        { token },
      );

      // Set a client-side marker for auth state tracking
      this.setAccessToken(AUTHENTICATED);

      return response;
    } catch (error) {
      handleError('OAuth authentication completion failed', error);
      throw error;
    }
  }

  /**
   * Initiates Google OAuth login
   * Uses the Next.js API as a proxy to securely add the API key to the request
   */
  googleLogin(): void {
    window.location.href = `${this.apiClient.getConfig().BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE_LOGIN}`;
  }

  /**
   * Checks if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Gets the access token from cookies
   */
  getAccessToken(): string | undefined {
    return Cookies.get(this.accessTokenKey);
  }

  /**
   * Sets the access token in cookies
   */
  private setAccessToken(token: string): void {
    Cookies.set(this.accessTokenKey, token, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }

  /**
   * Clears all authentication tokens
   */
  private clearTokens(): void {
    Cookies.remove(this.accessTokenKey);
  }

  /**
   * Handles token refresh failure by logging out and redirecting if needed
   * Made public so it can be used as a callback by other services
   */
  async handleTokenRefreshFailure(): Promise<void> {
    console.log('Token refresh failed, logging out user');

    // Logout the user (clear tokens)
    await this.logout();

    // Only redirect if we're in the browser and the current URL is not whitelisted
    if (typeof window !== 'undefined') {
      const shouldRedirectToLogin = this.shouldRedirectToFELogin();

      if (shouldRedirectToLogin) {
        window.location.href = '/login';
      }
    }
  }

  /**
   * Determines if the current URL should trigger a redirect to FE login
   * @returns boolean indicating whether to redirect
   */
  private shouldRedirectToFELogin(): boolean {
    const currentPath = window.location.pathname;

    // Don't redirect if the current path is in the whitelist
    return !AUTH_CONFIG.NON_FE_LOGIN_REDIRECT_PATHS.some(
      (path: string) =>
        path === currentPath || currentPath.startsWith(`${path}/`),
    );
  }
}
