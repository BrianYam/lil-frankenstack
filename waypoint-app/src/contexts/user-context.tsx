'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState, useMemo, useCallback } from 'react';
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
  forgotPassword: (data: { email: string }) => Promise<void>;
  resetPassword: (data: { token: string; password: string }) => Promise<void>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: Readonly<UserProviderProps>) {
  const [user, setUser] = useState<User | null>(null);
  const auth = useAuth();
  const {
    login: authLogin,
    logout,
    googleLogin, 
    forgotPassword: authForgotPassword,
    resetPassword: authResetPassword,
    changePassword: authChangePassword,
    isAuthenticated, 
    isLoading: authLoading, 
    error: authError 
  } = auth;
  const { currentUser, isLoadingCurrentUser, currentUserError, refetchCurrentUser } = useUsers();

  // Wrap the login function to ensure it correctly passes credentials
  const login = useCallback((email: string, password: string) => {
    console.log("UserContext login called with:", email, password);
    return authLogin({ email, password });
  }, [authLogin]);

  // Wrap the forgotPassword function to make it awaitable
  const forgotPassword = useCallback(async (data: { email: string }) => {
    return new Promise<void>((resolve, reject) => {
      const onSuccess = () => resolve();
      const onError = (error: Error) => reject(error);

      authForgotPassword(data, { onSuccess, onError });
    });
  }, [authForgotPassword]);

  // Wrap the resetPassword function to make it awaitable
  const resetPassword = useCallback(async (data: { token: string; password: string }) => {
    return new Promise<void>((resolve, reject) => {
      const onSuccess = () => resolve();
      const onError = (error: Error) => reject(error);

      authResetPassword(data, { onSuccess, onError });
    });
  }, [authResetPassword]);

  // Handle password change
  const changePassword = useCallback(async (data: { currentPassword: string; newPassword: string }) => {
    return new Promise<void>((resolve, reject) => {
      const onSuccess = () => resolve();
      const onError = (error: Error) => reject(error);

      authChangePassword(data, { onSuccess, onError });
    });
  }, [authChangePassword]);

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
          console.error("Failed to fetch current user:", error);
        }
      })();
    }
  }, [isAuthenticated, refetchCurrentUser]);

  const value = useMemo(() => ({
    user,
    isLoading: authLoading || isLoadingCurrentUser,
    error: authError || currentUserError,
    login,
    logout,
    googleLogin,
    forgotPassword,
    resetPassword,
    changePassword,
    isAuthenticated,
  }), [
    user,
    authLoading,
    isLoadingCurrentUser,
    authError,
    currentUserError,
    login,
    logout,
    googleLogin,
    forgotPassword,
    resetPassword,
    changePassword,
    isAuthenticated
  ]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

//TODO check all the usage, i dont think we need to combine user context and users hook
