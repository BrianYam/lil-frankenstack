
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { AuthService } from './auth.service';

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
      withCredentials: true,
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
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
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
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
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
    // Request interceptor - simplified since we're using cookie-based auth
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // No need to add Authorization header - backend uses cookie authentication
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

        // If error is 401 Unauthorized and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Prevent multiple refresh attempts
          if (!this.refreshingPromise) {
            this.refreshingPromise = new Promise<void>(async (resolve, reject) => {
              try {
                await this.authService.refreshTokens();
                resolve();
              } catch (refreshError) {
                // If refresh fails, redirect to login
                this.authService.logout();
                // Redirect to login page if needed
                if (typeof window !== 'undefined') {
                  window.location.href = '/login';
                }
                reject(refreshError);
              } finally {
                this.refreshingPromise = null;
              }
            });
          }

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
}
