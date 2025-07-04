'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUsers } from '@/hooks';
import { AuthForm } from '@/components/auth/AuthForm';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { ProcessingModal } from '@/components/ui/processing-modal';
import { ApiError, AuthFormType } from "@/types";

export default function SignupPage() {
  const [formError, setFormError] = useState('');
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [isSignupComplete, setIsSignupComplete] = useState(false);
  const { googleLogin } = useAuth();
  const { createUser, isCreatingUser, createUserError } = useUsers();

  // Effect to handle errors from createUser mutation
  useEffect(() => {
    if (createUserError) {
      setShowProcessingModal(false);
      const apiError = createUserError as ApiError;
      setFormError(
        apiError.response?.data?.message ?? createUserError.message
      );
    }
  }, [createUserError]);

  // Effect to handle successful user creation
  useEffect(() => {
    if (!isCreatingUser && showProcessingModal && !createUserError) {
      // If we're no longer creating a user, the modal is showing, and there's no error,
      // then the user creation was successful
      setShowProcessingModal(false);
      setIsSignupComplete(true);
    }
  }, [isCreatingUser, showProcessingModal, createUserError]);

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
    
    // Show the processing modal
    setShowProcessingModal(true);

    // Create user - the effects will handle success/error states
    createUser({ email: data.email, password: data.password });
  };

  const handleGoogleLogin = () => {
    try {
      googleLogin();
    } catch (err) {
      console.error('Google login error:', err);
    }
  };

  // Show a success message after signing up, prompting the user to check their email
  if (isSignupComplete) {
    return (
      <AuthLayout
        title="Account Created Successfully!"
        subtitle="Please check your email"
        alternateLink={{
          text: 'return to login',
          href: '/login',
          description: 'return to login page'
        }}
        bgClass="bg-gradient-to-b from-indigo-50 to-blue-50"
      >
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Verification Email Sent</h2>
          <p className="mb-4 text-gray-700">
            We&#39;ve sent a verification email to your inbox. Please check your email and click the verification link to activate your account.
          </p>
          <p className="text-sm text-gray-500">
            If you don&#39;t see the email, check your spam folder or try to log in to request a new verification link.
          </p>
        </div>
      </AuthLayout>
    );
  }

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
