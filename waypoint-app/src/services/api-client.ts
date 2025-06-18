import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { AuthService } from './auth.service';
import { API_CONFIG } from '@/config/api.config';
import { AUTH_CONFIG } from '@/config/auth.config';

/**
 * ApiClient class for making HTTP requests
 * Handles authentication, token refreshing, and other common API operations
 */
export class ApiClient {
  private axiosInstance: AxiosInstance;
  private authService: AuthService;
  private refreshingPromise: Promise<void> | null = null;

  /**
   * Creates a new ApiClient instance
   * @param authService - The auth service instance for token management
   * @param baseURL - Base URL for API requests
   */
  constructor(authService: AuthService, baseURL?: string) {
    this.authService = authService;
    this.axiosInstance = axios.create({
      baseURL: baseURL || authService.getApiUrl(),
      withCredentials: true, // This ensures cookies are sent with every request
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Makes a GET request
   * @param url - The URL to request
   * @param config - Optional Axios config
   * @returns Promise with the response data
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  /**
   * Makes a POST request
   * @param url - The URL to request
   * @param data - The data to send
   * @param config - Optional Axios config
   * @returns Promise with the response data
   */
  async post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Makes a PUT request
   * @param url - The URL to request
   * @param data - The data to send
   * @param config - Optional Axios config
   * @returns Promise with the response data
   */
  async put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Makes a DELETE request
   * @param url - The URL to request
   * @param config - Optional Axios config
   * @returns Promise with the response data
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  /**
   * Sets up response interceptors
   * Handles token refreshing and authentication errors
   */
  private setupInterceptors(): void {
    // Request interceptor - add API key header to all requests
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add the API key header to all requests
        config.headers = config.headers || {};
        config.headers[API_CONFIG.HEADERS.API_KEY_HEADER] = API_CONFIG.API_KEY;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 Unauthorized, and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Prevent multiple refresh attempts
          this.refreshingPromise ??= new Promise<void>(async (resolve, reject) => {
            try {
              await this.authService.refreshTokens();
              resolve();
            } catch (refreshError) {
              // If refresh fails, logout
              this.authService.logout();

              // Only redirect if we're in the browser and the current URL is not whitelisted
              if (typeof window !== 'undefined') {
                const shouldRedirectToLogin = this.shouldRedirectToLogin();

                if (shouldRedirectToLogin) {
                  window.location.href = '/login';
                }
              }
              reject(refreshError);
            } finally {
              this.refreshingPromise = null;
            }
          });

          try {
            await this.refreshingPromise;
            
            // Retry the original request - no need to add token since we're using cookies
            return axios(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Determines if the current URL should trigger a redirect to login
   * @returns boolean indicating whether to redirect
   */
  private shouldRedirectToLogin(): boolean {
    const currentPath = window.location.pathname;

    // Don't redirect if the current path is in the whitelist
    return !AUTH_CONFIG.NON_AUTH_REDIRECT_URLS.some(path =>
      path === currentPath || currentPath.startsWith(`${path}/`)
    );
  }
}
