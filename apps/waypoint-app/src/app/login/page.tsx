'use client';

import { useState } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthFormType } from "@/types";
import { useAuth } from '@/hooks/use-auth'; // Use useAuth for all login-related functionality

export default function LoginPage() {
  const [formError, setFormError] = useState('');
  const { login, googleLogin, isLoading, error } = useAuth(); // Use this for auth actions

  const handleSubmit = async (data: { email: string; password: string }) => {
    setFormError('');
    
    if (!data.email || !data.password) {
      setFormError('Email and password are required');
      return;
    }
    
    try {
      console.log('Submitting login with:', data.email, data.password);
      login(data.email, data.password);
      // The auth hook will redirect if successful
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleGoogleLogin = () => {
    try {
      googleLogin();
    } catch (err) {
      console.error('Google login error:', err);
    }
  };

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Or"
      alternateLink={{
        text: 'create a new account',
        href: '/signup',
        description: 'create a new account'
      }}
      bgClass="bg-gradient-to-b from-blue-50 to-indigo-50" // Using a gradient background
    >
      <AuthForm
        formType={AuthFormType.LOGIN}
        onSubmit={handleSubmit}
        onGoogleAuth={handleGoogleLogin}
        isLoading={isLoading}
        error={error}
        formError={formError}
      />
    </AuthLayout>
  );
}
