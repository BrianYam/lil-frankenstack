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
  forgotPassword: (data: { email: string }) => Promise<void>;
  resetPassword: (data: { token: string; password: string }) => Promise<void>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
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
  const login = (email: string, password: string) => {
    console.log("UserContext login called with:", email, password);
    return authLogin({ email, password });
  };

  // Wrap the forgotPassword function to make it awaitable
  const forgotPassword = async (data: { email: string }) => {
    return new Promise<void>((resolve, reject) => {
      try {
        authForgotPassword(data);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };

  // Wrap the resetPassword function to make it awaitable
  const resetPassword = async (data: { token: string; password: string }) => {
    return new Promise<void>((resolve, reject) => {
      try {
        authResetPassword(data);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };

  // Handle password change
  const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
    return new Promise<void>((resolve, reject) => {
      try {
        authChangePassword(data);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
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
    forgotPassword,
    resetPassword,
    changePassword,
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
