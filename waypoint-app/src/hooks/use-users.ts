
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiServices } from '@/services';
import { CreateUserRequest } from '@/types/users.types';

const usersService = ApiServices.getUsersService();

/**
 * Custom hook for user operations
 */
export function useUsers() {
  const queryClient = useQueryClient();

  /**
   * Get all users query
   */
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getAllUsers(),
    enabled: ApiServices.getAuthService().isAuthenticated(),
  });

  /**
   * Get current user profile query
   */
  const currentUserQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => usersService.getCurrentUser(),
    enabled: ApiServices.getAuthService().isAuthenticated(),
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
      queryClient.invalidateQueries({ queryKey: ['users'] });
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
      queryClient.invalidateQueries({ queryKey: ['users'] });
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
