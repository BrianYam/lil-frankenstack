import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { createApiConfig, ApiConfigOptions, API_ENDPOINTS } from './config';

/**
 * ApiClient class for making HTTP requests
 * Handles authentication, token refreshing, and other common API operations
 */
export class ApiClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly config: ReturnType<typeof createApiConfig>;
  private refreshingPromise: Promise<void> | null = null;

  /**
   * Creates a new ApiClient instance
   * @param configOptions - Configuration options for the API client
   */
  constructor(configOptions: ApiConfigOptions = {}) {
    this.config = createApiConfig(configOptions);
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
  async post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Makes a PUT request
   */
  async put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Makes a PATCH request
   */
  async patch<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
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
          config.headers[this.config.HEADERS.API_KEY_HEADER] = this.config.API_KEY;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error instanceof Error ? error : new Error(JSON.stringify(error)));
      }
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          //TODO
          // Handle token refresh logic here if needed
          // This can be extended by individual services
        }

        return Promise.reject(error);
      }
    );
  }
}
