import {
  useMutation,
  QueryClient,
  useQueryClient,
} from '@tanstack/react-query';
import { ApiServices } from '@lil-frankenstack/shared-services';
import {
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
} from '@lil-frankenstack/types';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const authService = ApiServices.getAuthService();

/**
 * Custom hook for authentication actions and state
 */
export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  /**
   * Login mutation
   */
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      setIsLoading(true);
      setError(null);
      console.log('Auth service login called with:', credentials);
      try {
        await authService.login(credentials);
        return true;
      } catch (err) {
        console.error('Error in login mutation function:', err);
        throw err; // Re-throw to be caught by onError
      }
    },
    onSuccess: () => {
      console.log('Successfully logged in');
      // Immediately invalidate current user query to update UI
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      router.push('/');
      setIsLoading(false);
    },
    onError: (error: unknown) => {
      console.error('Login mutation error:', error);
      setError(error instanceof Error ? error : new Error('Login failed'));
      setIsLoading(false);
    },
  });

  /**
   * Logout mutation
   */
  const logoutMutation = useMutation({
    mutationFn: () => {
      setIsLoading(true);
      return authService.logout();
    },
    onSuccess: () => {
      // Immediately invalidate current user query to update UI
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      router.push('/login');
      setIsLoading(false);
    },
    onError: (error: Error) => {
      setError(error);
      setIsLoading(false);
    },
  });

  /**
   * Forgot password mutation
   */
  const forgotPasswordMutation = useMutation({
    mutationFn: (data: ForgotPasswordRequest) => {
      setIsLoading(true);
      return authService.requestPasswordReset(data);
    },
    onSuccess: () => {
      setIsLoading(false);
    },
    onError: (error: Error) => {
      setError(error);
      setIsLoading(false);
    },
  });

  /**
   * Reset password mutation
   */
  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordRequest) => {
      setIsLoading(true);
      return authService.resetPassword(data);
    },
    onSuccess: () => {
      setIsLoading(false);
    },
    onError: (error: Error) => {
      setError(error);
      setIsLoading(false);
    },
  });

  /**
   * Change password mutation
   */
  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => {
      setIsLoading(true);
      return authService.changePassword(data);
    },
    onSuccess: () => {
      setIsLoading(false);
    },
    onError: (error: Error) => {
      setError(error);
      setIsLoading(false);
    },
  });

  /**
   * Email verification mutation
   */
  const verifyEmailMutation = useMutation({
    mutationFn: (data: VerifyEmailRequest) => {
      setIsLoading(true);
      return authService.verifyEmail(data);
    },
    onSuccess: () => {
      setIsLoading(false);
    },
    onError: (error: Error) => {
      setError(error);
      setIsLoading(false);
    },
  });

  /**
   * Get authentication state
   */
  const isAuthenticated = authService.isAuthenticated();

  /**
   * Google OAuth login
   */
  const googleLogin = () => {
    authService.googleLogin();
  };

  /**
   * Login with email and password
   */
  const login = (email: string, password: string) => {
    console.log('useAuth login called with:', email, password);
    loginMutation.mutate({ email, password });
  };

  /**
   * Forgot password with email
   * Returns a promise for better handling in components
   */
  const forgotPassword = (data: { email: string }) => {
    return new Promise<void>((resolve, reject) => {
      forgotPasswordMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      });
    });
  };

  /**
   * Reset password with token and new password
   * Returns a promise for better handling in components
   */
  const resetPassword = (data: { token: string; password: string }) => {
    return new Promise<void>((resolve, reject) => {
      resetPasswordMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      });
    });
  };

  /**
   * Change password
   * Returns a promise for better handling in components
   */
  const changePassword = (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    return new Promise<void>((resolve, reject) => {
      changePasswordMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      });
    });
  };

  /**
   * Verify email with token
   * Returns a promise for better handling in components
   */
  const verifyEmail = (token: string) => {
    return new Promise<void>((resolve, reject) => {
      verifyEmailMutation.mutate(
        { token },
        {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        },
      );
    });
  };

  /**
   * Complete OAuth authentication after redirect
   * @param token - The token from the URL hash
   * @returns Promise that resolves when authentication is complete
   */
  const completeOAuthAuthentication = async (token: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await authService.completeOAuthAuthentication(token);

      // Invalidate queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });

      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('OAuth authentication completion error:', err);
      setError(err instanceof Error ? err : new Error('Authentication failed'));
      setIsLoading(false);
      throw err;
    }
  };

  return {
    // Auth state
    isAuthenticated,
    isLoading,
    error,

    // Auth actions
    login,
    logout: logoutMutation.mutate,
    googleLogin,
    forgotPassword,
    resetPassword,
    changePassword,
    verifyEmail,
    completeOAuthAuthentication,
  };
}

/**
 * Sets up auth related query invalidations
 * @param queryClient - React Query client
 */
export function setupAuthInvalidations(queryClient: QueryClient) {
  // Set up a mutation cache listener to detect auth changes
  queryClient.getMutationCache().subscribe((event) => {
    // Check if the mutation is related to authentication
    const mutation = event.mutation;
    if (!mutation) return;

    // Check if it's a login or logout mutation
    const isAuthMutation =
      mutation.options.mutationFn?.toString().includes('authService.login') ||
      mutation.options.mutationFn?.toString().includes('authService.logout');

    if (isAuthMutation && mutation.state.status === 'success') {
      console.log('Auth invalidation - Auth change detected in mutation cache');

      // Force an immediate refresh of the currentUser data
      queryClient
        .invalidateQueries({ queryKey: ['currentUser'], refetchType: 'all' })
        .catch((error) => {
          console.error('Error invalidating currentUser queries:', error);
        });
    }
  });
}
