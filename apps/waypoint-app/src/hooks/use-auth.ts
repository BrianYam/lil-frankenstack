import {
  useMutation,
  QueryClient,
  useQueryClient,
} from '@tanstack/react-query';
import {
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
} from '@/types';
import { useRouter } from 'next/navigation';
import { queryKeys, apiServices } from '@/hooks/index';
import { useCallback, useMemo } from 'react';

/**
 * Custom hook for authentication actions and state
 */
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Memoize the authentication state to prevent unnecessary re-renders
  const isAuthenticated = useMemo(() => apiServices.auth.isAuthenticated(), []);

  /**
   * Centralized query invalidation for auth-related data
   */
  const invalidateAuthQueries = useCallback(() => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.users.currentUser }),
      queryClient.invalidateQueries({ queryKey: queryKeys.userDetails.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.userDetails.default }),
    ]);
  }, [queryClient]);

  /**
   * Login mutation
   */
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      console.log('Auth service login called with:', credentials);
      await apiServices.auth.login(credentials);
      return true;
    },
    onSuccess: async () => {
      console.log('Successfully logged in');
      await invalidateAuthQueries();
      router.push('/');
    },
    onError: (error: unknown) => {
      console.error('Login mutation error:', error);
    },
  });

  /**
   * Logout mutation
   */
  const logoutMutation = useMutation({
    mutationFn: () => apiServices.auth.logout(),
    onSuccess: async () => {
      await invalidateAuthQueries();
      router.push('/login');
    },
    onError: (error: Error) => {
      console.error('Logout mutation error:', error);
    },
  });

  /**
   * Forgot password mutation
   */
  const forgotPasswordMutation = useMutation({
    mutationFn: (data: ForgotPasswordRequest) =>
      apiServices.auth.requestPasswordReset(data),
  });

  /**
   * Reset password mutation
   */
  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordRequest) =>
      apiServices.auth.resetPassword(data),
  });

  /**
   * Change password mutation
   */
  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) =>
      apiServices.auth.changePassword(data),
  });

  /**
   * Email verification mutation
   */
  const verifyEmailMutation = useMutation({
    mutationFn: (data: VerifyEmailRequest) =>
      apiServices.auth.verifyEmail(data),
  });

  /**
   * OAuth completion mutation
   */
  const completeOAuthMutation = useMutation({
    mutationFn: (token: string) =>
      apiServices.auth.completeOAuthAuthentication(token),
    onSuccess: async () => {
      await invalidateAuthQueries();
    },
  });

  /**
   * Google OAuth login
   */
  const googleLogin = useCallback(() => {
    apiServices.auth.googleLogin();
  }, []);

  /**
   * Login with email and password
   */
  const login = useCallback((email: string, password: string) => {
    console.log('useAuth login called with:', email, password);
    loginMutation.mutate({ email, password });
  }, [loginMutation]);

  /**
   * Forgot password with email
   * Returns a promise for better handling in components
   */
  const forgotPassword = useCallback((data: { email: string }) => {
    return new Promise<void>((resolve, reject) => {
      forgotPasswordMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      });
    });
  }, [forgotPasswordMutation]);

  /**
   * Reset password with token and new password
   * Returns a promise for better handling in components
   */
  const resetPassword = useCallback((data: { token: string; password: string }) => {
    return new Promise<void>((resolve, reject) => {
      resetPasswordMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      });
    });
  }, [resetPasswordMutation]);

  /**
   * Change password
   * Returns a promise for better handling in components
   */
  const changePassword = useCallback((data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    return new Promise<void>((resolve, reject) => {
      changePasswordMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      });
    });
  }, [changePasswordMutation]);

  /**
   * Verify email with token
   * Returns a promise for better handling in components
   */
  const verifyEmail = useCallback((token: string) => {
    return new Promise<void>((resolve, reject) => {
      verifyEmailMutation.mutate(
        { token },
        {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        },
      );
    });
  }, [verifyEmailMutation]);

  /**
   * Complete OAuth authentication after redirect
   * @param token - The token from the URL hash
   * @returns Promise that resolves when authentication is complete
   */
  const completeOAuthAuthentication = useCallback(async (token: string) => {
    try {
      await completeOAuthMutation.mutateAsync(token);
      return true;
    } catch (err) {
      console.error('OAuth authentication completion error:', err);
      throw err;
    }
  }, [completeOAuthMutation]);

  // Derive loading state from mutations
  const isLoading =
    loginMutation.isPending ||
    logoutMutation.isPending ||
    forgotPasswordMutation.isPending ||
    resetPasswordMutation.isPending ||
    changePasswordMutation.isPending ||
    verifyEmailMutation.isPending ||
    completeOAuthMutation.isPending;

  // Derive error state from mutations
  const error =
    loginMutation.error ||
    logoutMutation.error ||
    forgotPasswordMutation.error ||
    resetPasswordMutation.error ||
    changePasswordMutation.error ||
    verifyEmailMutation.error ||
    completeOAuthMutation.error;

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
        .invalidateQueries({
          queryKey: queryKeys.users.currentUser,
          refetchType: 'all',
        })
        .catch((error) => {
          console.error('Error invalidating currentUser queries:', error);
        });
    }
  });
}
