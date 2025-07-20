import axios from 'axios';

/**
 * Handles and logs API errors with consistent formatting
 * @param message - Custom error message
 * @param error - The error object
 */
export function handleError(message: string, error: unknown): void {
  // Extract the error message from axios error if available
  let errorMessage = message;
  if (axios.isAxiosError(error) && error.response) {
    const serverError = error.response.data;
    errorMessage =
      serverError?.message ?? `${message} (${error.response.status})`;
  }

  console.error(`${errorMessage}:`, error);
}
