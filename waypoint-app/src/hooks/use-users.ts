import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiServices } from '@/services';
import { CreateUserRequest } from '@/types/users.types';

const usersService = ApiServices.getUsersService();

/**
 * Custom hook for user operations
 * This hook handles operations related to users management including:
 * - Fetching all users
 * - Fetching the current logged-in user
 * - Creating new users
 * - Deleting users
 */
export function useUsers() {
  const queryClient = useQueryClient();

  /**
   * Get all users query
   */
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      console.log('Fetching all users...');
      const result = await usersService.getAllUsers();
      console.log('Users fetched:', result.length);
      return result;
    },
    // Disable automatic query execution - will only fetch users when manually triggered
    enabled: false
  });

  /**
   * Get current user profile query
   */
  const currentUserQuery = useQuery({
    queryKey: ['currentUser'],
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
      queryClient.invalidateQueries({ queryKey: ['users'] }) //TODO dont do this since we need them to confirm the user creation
        .catch(error => {
          console.error('Error invalidating users queries:', error);
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
      // Invalidate users query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['users'] })
        .catch(error => {
          console.error('Error invalidating users queries:', error);
        });
    },
  });

  return {
    // Queries
    users: usersQuery.data || [],
    currentUser: currentUserQuery.data,
    isLoadingUsers: usersQuery.isLoading,
    isLoadingCurrentUser: currentUserQuery.isLoading,
    usersError: usersQuery.error,
    currentUserError: currentUserQuery.error,

    // Mutations
    createUser: createUserMutation.mutate,
    isCreatingUser: createUserMutation.isPending,
    createUserError: createUserMutation.error,

    deleteUser: deleteUserMutation.mutate,
    isDeletingUser: deleteUserMutation.isPending,
    deleteUserError: deleteUserMutation.error,

    // Refetch methods
    refetchUsers: usersQuery.refetch,
    refetchCurrentUser: currentUserQuery.refetch,
  };
}
