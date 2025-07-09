'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/contexts/user-context';
import { useUsers } from '@/hooks';
import { User, UserRole, UpdateUserRequest } from '@/types';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trash2, UserX, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { ApiError } from '@/types';

export default function UsersManagementPage() {
  const {
    user: currentUser,
    isLoading: isLoadingCurrentUser,
    isAuthenticated,
  } = useUserContext();
  const router = useRouter();

  // Users data and mutations
  const {
    users,
    refetchUsers,
    isLoadingUsers,
    usersError,
    updateUser,
    isUpdatingUser,
    updateUserError,
    deleteUser,
    isDeletingUser,
    deleteUserError,
  } = useUsers();

  // State for notifications
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: 'success' | 'error';
      message: string;
    }>
  >([]);

  // Fetch users when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      refetchUsers();
    }
  }, [isAuthenticated, refetchUsers]);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (
      !isLoadingCurrentUser &&
      (!isAuthenticated || (currentUser && currentUser.role !== UserRole.ADMIN))
    ) {
      router.push('/me');
    }
  }, [isLoadingCurrentUser, isAuthenticated, currentUser, router]);

  // Handle notifications
  const addNotification = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);

    // Auto-remove notification after 3 seconds
    setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id),
      );
    }, 3000);
  };

  // Handle toggle user active status
  const handleToggleActive = (user: User) => {
    const updateData = { isActive: !user.isActive } as UpdateUserRequest;
    const newStatus = updateData.isActive ? 'activated' : 'deactivated';

    updateUser(
      { userId: user.id, userData: updateData },
      {
        onSuccess: () => {
          addNotification(
            'success',
            `User ${user.email} ${newStatus} successfully.`,
          );
        },
        onError: (error: Error) => {
          const apiError = error as unknown as ApiError;
          addNotification(
            'error',
            `Error updating user: ${apiError?.response?.data?.message ?? 'Failed to update user'}`,
          );
        },
      },
    );
  };

  // Handle delete user
  const handleDeleteUser = () => {
    if (!userToDelete) return;

    deleteUser(userToDelete.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
        addNotification(
          'success',
          `User ${userToDelete.email} deleted successfully.`,
        );
      },
      onError: (error: Error) => {
        const apiError = error as unknown as ApiError;
        setIsDeleteDialogOpen(false);
        addNotification(
          'error',
          `Error deleting user: ${apiError?.response?.data?.message ?? 'Unknown error'}`,
        );
      },
    });
  };

  // Show loading spinner while loading current user
  if (isLoadingCurrentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-blue-50 px-4">
        <div className="text-center">
          <Spinner size="lg" className="mb-2" />
          <p className="text-indigo-600 font-medium">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Render table or loading/empty state
  const renderUserContent = () => {
    if (isLoadingUsers) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner className="mb-4" size="lg" />
          <p className="text-indigo-600 font-medium">Loading users...</p>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="text-center py-12 bg-blue-50 rounded-lg">
          <AlertCircle className="mx-auto h-12 w-12 text-blue-500 mb-3" />
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            No Users Found
          </h3>
          <p className="text-blue-700">There are no users in the system yet.</p>
        </div>
      );
    }

    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
          <h2 className="text-lg font-medium text-indigo-800">
            {users.length} {users.length === 1 ? 'User' : 'Users'} Found
          </h2>
          <Button
            onClick={() => refetchUsers()}
            variant="outline"
            className="flex items-center gap-2 text-indigo-600 border-indigo-200 bg-white hover:bg-indigo-50 hover:text-indigo-700 transition-colors shadow-sm w-full sm:w-auto"
          >
            <RefreshCw size={16} className="opacity-80" />
            Refresh
          </Button>
        </div>

        {/* Desktop Table (hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableCaption className="text-indigo-800">
              Showing all {users.length} users in the system
            </TableCaption>
            <TableHeader>
              <TableRow className="bg-indigo-50">
                <TableHead className="font-bold text-indigo-900">
                  Email
                </TableHead>
                <TableHead className="font-bold text-indigo-900">
                  Role
                </TableHead>
                <TableHead className="font-bold text-indigo-900">
                  Status
                </TableHead>
                <TableHead className="font-bold text-indigo-900">
                  Created At
                </TableHead>
                <TableHead className="font-bold text-indigo-900">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-blue-50">
                  <TableCell className="font-medium text-blue-900">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === UserRole.ADMIN
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={() => handleToggleActive(user)}
                        disabled={isUpdatingUser}
                        className={
                          user.isActive ? 'bg-green-600' : 'bg-gray-400'
                        }
                      />
                      <span
                        className={`ml-2 text-sm font-medium ${
                          user.isActive ? 'text-green-700' : 'text-gray-600'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setUserToDelete(user);
                        setIsDeleteDialogOpen(true);
                      }}
                      disabled={isDeletingUser || user.id === currentUser?.id}
                      className="flex items-center gap-1 bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 size={16} />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View (shown only on mobile) */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-blue-900 break-all">
                    {user.email}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === UserRole.ADMIN
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div className="text-sm text-gray-700">
                    Created:{' '}
                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-1">
                  <div className="flex items-center">
                    <Switch
                      checked={user.isActive}
                      onCheckedChange={() => handleToggleActive(user)}
                      disabled={isUpdatingUser}
                      className={user.isActive ? 'bg-green-600' : 'bg-gray-400'}
                    />
                    <span
                      className={`ml-2 text-sm font-medium ${
                        user.isActive ? 'text-green-700' : 'text-gray-600'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setUserToDelete(user);
                      setIsDeleteDialogOpen(true);
                    }}
                    disabled={isDeletingUser || user.id === currentUser?.id}
                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 size={16} />
                    <span className="sr-only sm:not-sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-blue-100 py-12">
      <Container className="max-w-6xl py-4 sm:py-8">
        {/* Floating notifications - responsive positioning */}
        <div className="fixed bottom-4 sm:top-4 right-4 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-72">
          {notifications.map((notification) => (
            <Alert
              key={notification.id}
              variant={
                notification.type === 'success' ? 'default' : 'destructive'
              }
              className={`
                shadow-lg border animate-in fade-in slide-in-from-right-5 sm:slide-in-from-top-5 
                ${
                  notification.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }
              `}
            >
              <div className="flex items-center">
                {notification.type === 'success' ? (
                  <Check className="h-5 w-5 flex-shrink-0 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mr-2" />
                )}
                <AlertDescription className="font-medium text-sm">
                  {notification.message}
                </AlertDescription>
              </div>
            </Alert>
          ))}
        </div>

        <Card className="w-full mx-auto shadow-lg sm:shadow-xl border border-indigo-100 overflow-hidden">
          <CardHeader className="bg-white border-b border-indigo-100 bg-gradient-to-r from-indigo-600 to-blue-600 p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-white">
              Manage Users
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white p-3 sm:p-6">
            {(usersError || updateUserError || deleteUserError) && (
              <Alert
                variant="destructive"
                className="mb-4 sm:mb-6 bg-red-50 border-red-300 text-red-900"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                <AlertTitle className="text-red-800 font-bold">
                  Error
                </AlertTitle>
                <AlertDescription className="text-red-800 text-sm">
                  An error occurred loading or updating users. Please try again.
                </AlertDescription>
              </Alert>
            )}

            {/* Users Table with extracted rendering logic */}
            {renderUserContent()}
          </CardContent>
        </Card>
      </Container>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-[95%] sm:max-w-md border border-gray-100 shadow-xl bg-white rounded-xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-gray-800 flex items-center gap-2">
              <UserX size={22} className="text-rose-500 flex-shrink-0" />
              Delete User
            </DialogTitle>
            <DialogDescription className="text-gray-600 pt-2">
              Are you sure you want to delete the user{' '}
              <strong className="text-indigo-600 font-semibold break-all">
                {userToDelete?.email}
              </strong>
              ?
              <p className="mt-2 text-rose-500 font-medium">
                This action cannot be undone.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="w-full sm:w-auto border-gray-200 text-white hover:bg-gray-500 transition-colors"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeletingUser}
              className="w-full sm:w-auto bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-sm transition-all"
            >
              {isDeletingUser ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} className="mr-2 flex-shrink-0" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
