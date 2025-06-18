'use client';

import { useState } from 'react';
import { useUser } from '@/contexts/user-context';
import { useUsers } from '@/hooks/use-users';
import { AuthForm } from '@/components/auth/AuthForm';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { ProcessingModal } from '@/components/ui/processing-modal';
import { AuthFormType } from "@/types";

export default function SignupPage() {
  const [formError, setFormError] = useState('');
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const { login, googleLogin } = useUser();
  const { createUser, isCreatingUser, createUserError } = useUsers();

  const handleSubmit = async (data: { email: string; password: string; confirmPassword?: string }) => {
    setFormError('');
    
    if (!data.email || !data.password || !data.confirmPassword) {
      setFormError('All fields are required');
      return;
    }
    
    if (data.password !== data.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    try {
      // Create user
      createUser({ email: data.email, password: data.password });
      console.log('User created successfully, now logging in');

      // Show the processing modal
      setShowProcessingModal(true);

      // Add a delay to ensure user creation is processed
      await new Promise((resolve) => setTimeout(resolve, 5000));
      
      // Hide the modal
      setShowProcessingModal(false);

      // Login with the newly created credentials
      login(data.email, data.password);
      
      // The auth hook will redirect if successful
    } catch (err) {
      setShowProcessingModal(false);
      console.error('Signup error:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to create account');
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
    <>
      <ProcessingModal
        isVisible={showProcessingModal}
        title="Account Creation in Progress"
        description="Your account is being created. Please wait while we set everything up for you."
      />
      
      <AuthLayout
        title="Create your account"
        subtitle="Or"
        alternateLink={{
          text: 'sign in to your existing account',
          href: '/login',
          description: 'sign in to your existing account'
        }}
        bgClass="bg-gradient-to-b from-indigo-50 to-blue-50" // Gradient background
      >
        <AuthForm
          formType={AuthFormType.SIGNUP}
          onSubmit={handleSubmit}
          onGoogleAuth={handleGoogleLogin}
          isLoading={isCreatingUser}
          error={createUserError}
          formError={formError}
        />
      </AuthLayout>
    </>
  );
}
