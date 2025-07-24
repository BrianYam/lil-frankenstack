import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateUserRequest, UpdateUserRequest } from '@/types';
import { queryKeys, apiServices } from '@/hooks/index';
import { useCallback } from 'react';

/**
 * Custom hook for user operations
 * This hook handles operations related to users management including:
 * - Fetching all users
 * - Fetching the current logged-in user
 * - Creating new users
 * - Updating users
 * - Deleting users
 */
export function useUsers() {
  const queryClient = useQueryClient();

  /**
   * Centralized query invalidation for user-related data
   */
  const invalidateUserQueries = useCallback(() => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.users.currentUser }),
    ]);
  }, [queryClient]);

  /**
   * Get all users query
   */
  const usersQuery = useQuery({
    queryKey: queryKeys.users.all,
    queryFn: async () => {
      console.log('Fetching all users...');
      const result = await apiServices.users.getAllUsers();
      console.log('Users fetched:', result.length);
      return result;
    },
    // Disable automatic query execution - will only fetch users when manually triggered
    enabled: false,
  });

  /**
   * Get current user profile query
   */
  const currentUserQuery = useQuery({
    queryKey: queryKeys.users.currentUser,
    queryFn: async () => {
      const isAuthenticated = apiServices.auth.isAuthenticated();
      console.log('Fetching current user, auth status:', isAuthenticated);
      if (!isAuthenticated) {
        return null;
      }
      return apiServices.users.getCurrentUser();
    },
    enabled: apiServices.auth.isAuthenticated(), // Only run when authenticated
    retry: (failureCount, error: Error) => {
      // Don't retry on 401 errors (unauthorized)
      if (error && 'status' in error && error.status === 401) return false;
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  /**
   * Create user mutation
   */
  const createUserMutation = useMutation({
    mutationFn: (userData: CreateUserRequest) => {
      return apiServices.users.createUser(userData);
    },
    onSuccess: async () => {
      await invalidateUserQueries();
    },
    onError: (error: Error) => {
      console.error('Create user mutation error:', error);
    },
  });

  /**
   * Update user mutation
   */
  const updateUserMutation = useMutation({
    mutationFn: ({
      userId,
      userData,
    }: {
      userId: string;
      userData: UpdateUserRequest;
    }) => {
      return apiServices.users.updateUser(userId, userData);
    },
    onSuccess: async () => {
      await invalidateUserQueries();
      // Manually trigger refetch for disabled queries
      await usersQuery.refetch();
    },
    onError: (error: Error) => {
      console.error('Update user mutation error:', error);
    },
  });

  /**
   * Delete user mutation
   */
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => {
      return apiServices.users.deleteUser(userId);
    },
    onSuccess: async () => {
      await invalidateUserQueries();
      // Manually trigger refetch for disabled queries
      await usersQuery.refetch();
    },
    onError: (error: Error) => {
      console.error('Delete user mutation error:', error);
    },
  });

  return {
    // Queries
    usersQuery,
    currentUserQuery,

    // Mutations
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
  };
}
