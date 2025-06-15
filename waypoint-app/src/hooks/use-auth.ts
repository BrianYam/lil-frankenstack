
import { useMutation, QueryClient } from '@tanstack/react-query';
import { ApiServices } from '@/services';
import { LoginRequest, ForgotPasswordRequest, ResetPasswordRequest } from '@/types/auth.types';
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
    mutationFn: (credentials: LoginRequest) => {
      setIsLoading(true);
      setError(null);
      return authService.login(credentials);
    },
    onSuccess: () => {
      router.push('/'); // Redirect to homepage or dashboard
      setIsLoading(false);
    },
    onError: (error: Error) => {
      setError(error);
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
      router.push('/login');
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

  return {
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    forgotPassword: forgotPasswordMutation.mutate,
    resetPassword: resetPasswordMutation.mutate,
    googleLogin,
    isAuthenticated,
    isLoading,
    error,
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
      // Invalidate user queries when auth state changes
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}
