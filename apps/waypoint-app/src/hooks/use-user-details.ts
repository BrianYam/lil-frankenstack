import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiServices } from '@/services';
import {
  UserDetails,
  CreateUserDetailsRequest,
  UpdateUserDetailsRequest,
} from '@/types';
import { queryKeys } from '@/hooks/index';

const userDetailsService = ApiServices.getUserDetailsService();

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
   * Get all user details query
   */
  const allUserDetailsQuery = useQuery({
    queryKey: queryKeys.userDetails.all,
    queryFn: async () => {
      console.log('Fetching all user details...');
      const result = await userDetailsService.getAllUserDetails();
      console.log('All user details fetched:', result.length);
      return result;
    },
  });

  /**
   * Get default user details query
   */
  const defaultUserDetailsQuery = useQuery({
    queryKey: queryKeys.userDetails.default,
    queryFn: async () => {
      console.log('Fetching default user details...');
      const result = await userDetailsService.getDefaultUserDetails();
      console.log('Default user details fetched:', result);
      return result;
    },
  });

  /**
   * Get user details by ID query
   */
  const useUserDetailsById = (id: string) =>
    useQuery({
      queryKey: queryKeys.userDetails.byId(id),
      queryFn: async () => {
        console.log(`Fetching user details with ID: ${id}...`);
        const result = await userDetailsService.getUserDetailsById(id);
        console.log(`User details with ID ${id} fetched:`, result);
        return result;
      },
      enabled: !!id, // Only run if id is provided
    });

  /**
   * Create user details mutation
   */
  const createUserDetailsMutation = useMutation({
    mutationFn: (userDetailsData: CreateUserDetailsRequest) => {
      return userDetailsService.create(userDetailsData);
    },
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: queryKeys.userDetails.all })
        .catch((error) => {
          console.error('Error invalidating allUserDetails queries:', error);
        });
      queryClient
        .invalidateQueries({ queryKey: queryKeys.userDetails.default })
        .catch((error) => {
          console.error(
            'Error invalidating defaultUserDetails queries:',
            error,
          );
        });
      queryClient
        .invalidateQueries({ queryKey: queryKeys.users.currentUser })
        .catch((error) => {
          console.error('Error invalidating currentUser queries:', error);
        });
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
      return userDetailsService.updateUserDetails(id, userDetailsData);
    },
    onSuccess: (data: UserDetails) => {
      queryClient
        .invalidateQueries({ queryKey: queryKeys.userDetails.all })
        .catch((error) => {
          console.error('Error invalidating allUserDetails queries:', error);
        });
      queryClient
        .invalidateQueries({ queryKey: queryKeys.userDetails.default })
        .catch((error) => {
          console.error(
            'Error invalidating defaultUserDetails queries:',
            error,
          );
        });
      queryClient
        .invalidateQueries({ queryKey: queryKeys.userDetails.byId(data.id) })
        .catch((error) => {
          console.error('Error invalidating userDetails by ID queries:', error);
        });
      queryClient
        .invalidateQueries({ queryKey: queryKeys.users.currentUser })
        .catch((error) => {
          console.error('Error invalidating currentUser queries:', error);
        });
    },
  });

  /**
   * Set default user details mutation
   */
  const setDefaultUserDetailsMutation = useMutation({
    mutationFn: (id: string) => {
      return userDetailsService.setDefaultUserDetails(id);
    },
    onSuccess: (data: UserDetails) => {
      queryClient
        .invalidateQueries({ queryKey: queryKeys.userDetails.all })
        .catch((error) => {
          console.error('Error invalidating allUserDetails queries:', error);
        });
      queryClient
        .invalidateQueries({ queryKey: queryKeys.userDetails.default })
        .catch((error) => {
          console.error(
            'Error invalidating defaultUserDetails queries:',
            error,
          );
        });
      queryClient
        .invalidateQueries({ queryKey: queryKeys.userDetails.byId(data.id) })
        .catch((error) => {
          console.error('Error invalidating userDetails by ID queries:', error);
        });
      queryClient
        .invalidateQueries({ queryKey: queryKeys.users.currentUser })
        .catch((error) => {
          console.error('Error invalidating currentUser queries:', error);
        });
    },
  });

  /**
   * Delete user details mutation
   */
  const deleteUserDetailsMutation = useMutation({
    mutationFn: (id: string) => {
      return userDetailsService.deleteUserDetails(id);
    },
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: queryKeys.userDetails.all })
        .catch((error) => {
          console.error('Error invalidating allUserDetails queries:', error);
        });
      queryClient
        .invalidateQueries({ queryKey: queryKeys.userDetails.default })
        .catch((error) => {
          console.error(
            'Error invalidating defaultUserDetails queries:',
            error,
          );
        });
      queryClient
        .invalidateQueries({ queryKey: queryKeys.users.currentUser })
        .catch((error) => {
          console.error('Error invalidating currentUser queries:', error);
        });
    },
  });

  return {
    // Queries
    allUserDetails: allUserDetailsQuery.data || [],
    defaultUserDetails: defaultUserDetailsQuery.data,
    useUserDetailsById,
    isLoadingAllUserDetails: allUserDetailsQuery.isLoading,
    isLoadingDefaultUserDetails: defaultUserDetailsQuery.isLoading,
    allUserDetailsError: allUserDetailsQuery.error,
    defaultUserDetailsError: defaultUserDetailsQuery.error,

    // Mutations
    createUserDetails: createUserDetailsMutation.mutate,
    isCreatingUserDetails: createUserDetailsMutation.isPending,
    createUserDetailsError: createUserDetailsMutation.error,

    updateUserDetails: updateUserDetailsMutation.mutate,
    isUpdatingUserDetails: updateUserDetailsMutation.isPending,
    updateUserDetailsError: updateUserDetailsMutation.error,

    setDefaultUserDetails: setDefaultUserDetailsMutation.mutate,
    isSettingDefaultUserDetails: setDefaultUserDetailsMutation.isPending,
    setDefaultUserDetailsError: setDefaultUserDetailsMutation.error,

    deleteUserDetails: deleteUserDetailsMutation.mutate,
    isDeletingUserDetails: deleteUserDetailsMutation.isPending,
    deleteUserDetailsError: deleteUserDetailsMutation.error,

    // Refetch methods
    refetchAllUserDetails: allUserDetailsQuery.refetch,
    refetchDefaultUserDetails: defaultUserDetailsQuery.refetch,
  };
}
