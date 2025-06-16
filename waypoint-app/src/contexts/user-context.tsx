'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUsers } from '@/hooks/use-users';
import { User } from '@/types/users.types';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => void;
  logout: () => void;
  googleLogin: () => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const auth = useAuth();
  const { login: authLogin, logout, googleLogin, isAuthenticated, isLoading: authLoading, error: authError } = auth;
  const { currentUser, isLoadingCurrentUser, currentUserError, refetchCurrentUser } = useUsers();

  // Wrap the login function to ensure it correctly passes credentials
  const login = (email: string, password: string) => {
    console.log("UserContext login called with:", email, password);
    return authLogin({ email, password });
  };

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
      refetchCurrentUser();
    }
  }, [isAuthenticated, refetchCurrentUser]);

  const value = {
    user,
    isLoading: authLoading || isLoadingCurrentUser,
    error: authError || currentUserError,
    login,
    logout,
    googleLogin,
    isAuthenticated,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
