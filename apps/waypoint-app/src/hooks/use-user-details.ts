import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserDetails,
  CreateUserDetailsRequest,
  UpdateUserDetailsRequest,
} from '@/types';
import { queryKeys, apiServices } from '@/hooks/index';
import { useCallback } from 'react';

/**
 * Custom hook for user details operations
 * This hook handles operations related to user details management including:
 * - Fetching all user details
 * - Fetching default user details
 * - Fetching user details by ID
 * - Creating new user details
 * - Updating user details
 * - Setting default user details
 * - Deleting user details
 */
export function useUserDetails() {
  const queryClient = useQueryClient();

  /**
   * Centralized query invalidation for user details-related data
   */
  const invalidateUserDetailsQueries = useCallback(() => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.userDetails.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.userDetails.default }),
      queryClient.invalidateQueries({ queryKey: queryKeys.users.currentUser }),
    ]);
  }, [queryClient]);

  /**
   * Get all user details query
   */
  const allUserDetailsQuery = useQuery({
    queryKey: queryKeys.userDetails.all,
    queryFn: async () => {
      console.log('Fetching all user details...');
      const result = await apiServices.userDetails.getAllUserDetails();
      console.log('All user details fetched:', result.length);
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  /**
   * Get default user details query
   */
  const defaultUserDetailsQuery = useQuery({
    queryKey: queryKeys.userDetails.default,
    queryFn: async () => {
      console.log('Fetching default user details...');
      const result = await apiServices.userDetails.getDefaultUserDetails();
      console.log('Default user details fetched:', result);
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  /**
   * Get user details by ID query
   * Returns a hook that creates a query for the given ID
   */
  const useUserDetailsById = (id: string) => {
    return useQuery({
      queryKey: queryKeys.userDetails.byId(id),
      queryFn: async () => {
        console.log(`Fetching user details with ID: ${id}...`);
        const result = await apiServices.userDetails.getUserDetailsById(id);
        console.log(`User details with ID ${id} fetched:`, result);
        return result;
      },
      enabled: !!id, // Only run if id is provided
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    });
  };

  /**
   * Create user details mutation
   */
  const createUserDetailsMutation = useMutation({
    mutationFn: (userDetailsData: CreateUserDetailsRequest) => {
      return apiServices.userDetails.create(userDetailsData);
    },
    onSuccess: async () => {
      await invalidateUserDetailsQueries();
    },
    onError: (error: Error) => {
      console.error('Create user details mutation error:', error);
    },
  });

  /**
   * Update user details mutation
   */
  const updateUserDetailsMutation = useMutation({
    mutationFn: ({
      id,
      userDetailsData,
    }: {
      id: string;
      userDetailsData: UpdateUserDetailsRequest;
    }) => {
      return apiServices.userDetails.updateUserDetails(id, userDetailsData);
    },
    onSuccess: async (data: UserDetails) => {
      await invalidateUserDetailsQueries();
      // Invalidate specific user details query
      await queryClient.invalidateQueries({
        queryKey: queryKeys.userDetails.byId(data.id)
      });
    },
    onError: (error: Error) => {
      console.error('Update user details mutation error:', error);
    },
  });

  /**
   * Set default user details mutation
   */
  const setDefaultUserDetailsMutation = useMutation({
    mutationFn: (id: string) => {
      return apiServices.userDetails.setDefaultUserDetails(id);
    },
    onSuccess: async (data: UserDetails) => {
      await invalidateUserDetailsQueries();
      // Invalidate specific user details query
      await queryClient.invalidateQueries({
        queryKey: queryKeys.userDetails.byId(data.id)
      });
    },
    onError: (error: Error) => {
      console.error('Set default user details mutation error:', error);
    },
  });

  /**
   * Delete user details mutation
   */
  const deleteUserDetailsMutation = useMutation({
    mutationFn: (id: string) => {
      return apiServices.userDetails.deleteUserDetails(id);
    },
    onSuccess: async () => {
      await invalidateUserDetailsQueries();
    },
    onError: (error: Error) => {
      console.error('Delete user details mutation error:', error);
    },
  });

  return {
    // Queries
    allUserDetailsQuery,
    useUserDetailsById,
    defaultUserDetailsQuery,

    // Mutations
    createUserDetailsMutation,
    updateUserDetailsMutation,
    setDefaultUserDetailsMutation,
    deleteUserDetailsMutation,
  };
}
