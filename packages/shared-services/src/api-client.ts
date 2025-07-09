import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { createApiConfig, ApiConfigOptions, API_ENDPOINTS } from './config';

/**
 * Token refresh callback function type
 */
export type TokenRefreshCallback = () => Promise<void>;

/**
 * Token refresh failure callback function type
 */
export type TokenRefreshFailureCallback = () => Promise<void>;

/**
 * ApiClient class for making HTTP requests
 * Handles authentication, token refreshing, and other common API operations
 */
export class ApiClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly config: ReturnType<typeof createApiConfig>;
  private refreshingPromise: Promise<void> | null = null;
  private readonly tokenRefreshCallback?: TokenRefreshCallback;
  private readonly tokenRefreshFailureCallback?: TokenRefreshFailureCallback;

  /**
   * Creates a new ApiClient instance
   * @param configOptions - Configuration options for the API client
   * @param tokenRefreshCallback - Optional callback for token refresh
   * @param tokenRefreshFailureCallback - Optional callback for token refresh failure
   */
  constructor(
    configOptions: ApiConfigOptions = {},
    tokenRefreshCallback?: TokenRefreshCallback,
    tokenRefreshFailureCallback?: TokenRefreshFailureCallback,
  ) {
    this.config = createApiConfig(configOptions);
    this.tokenRefreshCallback = tokenRefreshCallback;
    this.tokenRefreshFailureCallback = tokenRefreshFailureCallback;
    this.axiosInstance = axios.create({
      baseURL: this.config.BASE_URL,
      timeout: this.config.TIMEOUT,
      withCredentials: true,
      headers: {
        'Content-Type': this.config.HEADERS.CONTENT_TYPE,
      },
    });

    this.setupInterceptors();
  }

  /**
   * Makes a GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  /**
   * Makes a POST request
   */
  async post<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Makes a PUT request
   */
  async put<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Makes a PATCH request
   */
  async patch<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Makes a DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  /**
   * Get the current configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Get the base URL
   */
  getBaseUrl(): string {
    return this.config.BASE_URL;
  }

  /**
   * Sets up request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add API key header to all requests
    this.axiosInstance.interceptors.request.use(
      (config) => {
        config.headers = config.headers || {};
        if (this.config.API_KEY) {
          // Add the API key header to all requests
          config.headers[this.config.HEADERS.API_KEY_HEADER] =
            this.config.API_KEY;
        }
        return config;
      },
      (error) => {
        return Promise.reject(
          error instanceof Error ? error : new Error(JSON.stringify(error)),
        );
      },
    );

    // Response interceptor for error handling and token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Check if this is the refresh token endpoint - if so, don't try to refresh again
        const isRefreshEndpoint = originalRequest?.url?.includes(
          API_ENDPOINTS.AUTH.REFRESH,
        );

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !isRefreshEndpoint &&
          this.tokenRefreshCallback
        ) {
          originalRequest._retry = true;

          // Prevent multiple refresh attempts
          this.refreshingPromise ??= new Promise<void>(
            async (resolve, reject) => {
              try {
                console.log('Refreshing tokens due to 401 Unauthorized error');
                await this.tokenRefreshCallback!();
                resolve();
              } catch (refreshError) {
                console.log('Token refresh failed, calling failure callback');
                // Call the failure callback which handles logout and redirect
                if (this.tokenRefreshFailureCallback) {
                  try {
                    await this.tokenRefreshFailureCallback();
                  } catch (failureError) {
                    console.error(
                      'Token refresh failure callback failed:',
                      failureError,
                    );
                  }
                }
                reject(
                  refreshError instanceof Error
                    ? refreshError
                    : new Error(JSON.stringify(refreshError)),
                );
              } finally {
                this.refreshingPromise = null;
              }
            },
          );

          try {
            await this.refreshingPromise;

            // Retry the original request
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            return Promise.reject(
              refreshError instanceof Error
                ? refreshError
                : new Error(JSON.stringify(refreshError)),
            );
          }
        }

        return Promise.reject(
          error instanceof Error ? error : new Error(JSON.stringify(error)),
        );
      },
    );
  }
}
