'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { useAuth, useUsers } from '@/hooks';
import { User } from '@/types';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: { message: string } | Error | null;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: Readonly<UserProviderProps>) {
  const [user, setUser] = useState<User | null>(null);
  const {
    isAuthenticated,
    isLoading: authLoading,
    error: authError,
  } = useAuth();
  const { currentUserQuery } = useUsers();

  const currentUser = currentUserQuery.data;
  const isLoadingCurrentUser = currentUserQuery.isLoading;
  const currentUserError = currentUserQuery.error;
  const refetchCurrentUser = currentUserQuery.refetch;

  // Update user when current user data changes
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    } else if (!isLoadingCurrentUser && !isAuthenticated) {
      setUser(null);
    }
  }, [currentUser, isLoadingCurrentUser, isAuthenticated]);

  // Fetch user data when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      // Using an IIFE (Immediately Invoked Function Expression) to handle the Promise
      (async () => {
        try {
          await refetchCurrentUser();
        } catch (error) {
          console.error('Failed to fetch current user:', error);
        }
      })();
    }
  }, [isAuthenticated, refetchCurrentUser]);

  const value = useMemo(
    () => ({
      user,
      isLoading: authLoading || isLoadingCurrentUser,
      error: authError || currentUserError,
      isAuthenticated,
    }),
    [
      user,
      authLoading,
      isLoadingCurrentUser,
      authError,
      currentUserError,
      isAuthenticated,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
