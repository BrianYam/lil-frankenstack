import { useMutation, QueryClient } from '@tanstack/react-query';
import { ApiServices } from '@/services';
import { LoginRequest, ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest } from '@/types/auth.types';
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
    console.log("useAuth login called with:", email, password);
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
  const changePassword = (data: { currentPassword: string; newPassword: string }) => {
    return new Promise<void>((resolve, reject) => {
      changePasswordMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      });
    });
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
  };
}

/**
 * Sets up auth related query invalidations
 * @param queryClient - React Query client
 */
export function setupAuthInvalidations(queryClient: QueryClient) {
  // Invalidate user queries on auth events
  queryClient.getQueryCache().subscribe(() => {
    const activeQueries = [...queryClient.getQueryCache().getAll()];
    
    // Check if there's a recent auth-related mutation
    const hasAuthChange = activeQueries.some(query => 
      query.options.queryKey?.[0] === 'login' || 
      query.options.queryKey?.[0] === 'logout'
    );
    
    if (hasAuthChange) {
      console.log('Auth invalidation - Auth change detected in query cache');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
        .catch(error => {
          console.error('Error invalidating currentUser queries:', error);
        });
    }
  });
}
