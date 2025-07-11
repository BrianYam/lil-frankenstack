import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiServices } from '@/services';
import { CreateUserRequest, UpdateUserRequest } from '@/types';
import { queryKeys } from '@/hooks/index';

const usersService = ApiServices.getUsersService();

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
   * Get all users query
   */
  const usersQuery = useQuery({
    queryKey: queryKeys.users.all,
    queryFn: async () => {
      console.log('Fetching all users...');
      const result = await usersService.getAllUsers();
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
      const isAuthenticated = ApiServices.getAuthService().isAuthenticated();
      console.log('Fetching current user, auth status:', isAuthenticated);
      if (!isAuthenticated) {
        return null;
      }
      return usersService.getCurrentUser();
    },
    // Don't cache null results when not authenticated
    meta: {
      skipCache: !ApiServices.getAuthService().isAuthenticated(),
    },
    // Run the query immediately when mounted, regardless of cache
    refetchOnMount: 'always',
    // Cache time reduced for more responsive auth state updates
    gcTime: 1000 * 30, // 30 seconds (formerly cacheTime)
  });

  /**
   * Create user mutation
   */
  const createUserMutation = useMutation({
    mutationFn: (userData: CreateUserRequest) => {
      return usersService.createUser(userData);
    },
    onSuccess: () => {
      // Invalidate users query to refresh the list
      queryClient
        .invalidateQueries({ queryKey: queryKeys.users.all })
        .catch((error) => {
          console.error('Error invalidating users queries:', error);
        });
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
      return usersService.updateUser(userId, userData);
    },
    onSuccess: () => {
      // Invalidate users query and manually trigger refetch since enabled: false
      queryClient
        .invalidateQueries({ queryKey: queryKeys.users.all })
        .then(() => usersQuery.refetch())
        .catch((error) => {
          console.error(
            'Error invalidating and refetching users queries:',
            error,
          );
        });
    },
  });

  /**
   * Delete user mutation
   */
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => {
      return usersService.deleteUser(userId);
    },
    onSuccess: () => {
      // Invalidate users query and manually trigger refetch since enabled: false
      queryClient
        .invalidateQueries({ queryKey: queryKeys.users.all })
        .then(() => usersQuery.refetch())
        .catch((error) => {
          console.error(
            'Error invalidating and refetching users queries:',
            error,
          );
        });
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
