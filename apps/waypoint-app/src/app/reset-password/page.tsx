'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks';  // Changed from useUser to useAuth
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { ResetPasswordFormRequest, resetPasswordSchema } from '@/lib/schemas';

export default function ResetPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const { resetPassword, isLoading, error } = useAuth();  // Changed from useUser to useAuth

  // Parse token from hash on component mount
  /**
   * Extract token from URL hash (#) instead of query parameters (?)
   * Security benefits of using hash fragments:
   * - Not sent to server in HTTP requests
   * - Not visible in server logs
   * - Not stored in browser history like query parameters
   * - Not included in Referer headers when navigating away
   * - Reduces risk of token exposure
   */
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#token=')) {
      setToken(hash.substring(7)); // Remove '#token='
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormRequest>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const onSubmit = async (data: ResetPasswordFormRequest) => {
    try {

      // Pass the token separately from the form data
      if (!token) {
        console.error('No token available for password reset');
        return;
      }

      await resetPassword({
        token: token,
        password: data.password,
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error('Reset password error:', err);
    }
  };

  // If no token is provided, show an error
  if (!token) {
    return (
      <AuthLayout
        title="Reset your password"
        subtitle="Or"
        alternateLink={{
          text: 'return to login',
          href: '/login',
          description: 'sign in to your account'
        }}
        bgClass="bg-gradient-to-b from-blue-50 to-indigo-50"
      >
        <Card className="w-full max-w-md py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-blue-100 backdrop-blur-sm bg-white">
          <div className="text-center py-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="mt-3 text-lg font-medium text-gray-900">Invalid reset link</h3>
            <p className="mt-2 text-sm text-gray-500">
              The password reset link is invalid or has expired. Please request a new password reset.
            </p>
            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                className="border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-indigo-700"
                onClick={() => window.location.href = '/forgot-password'}
              >
                Request new reset link
              </Button>
            </div>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Or"
      alternateLink={{
        text: 'return to login',
        href: '/login',
        description: 'sign in to your account'
      }}
      bgClass="bg-gradient-to-b from-blue-50 to-indigo-50"
    >
      <Card className="w-full max-w-md py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-blue-100 backdrop-blur-sm bg-white">
        {isSubmitted ? (
          <div className="text-center py-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-3 text-lg font-medium text-gray-900">Password reset successful</h3>
            <p className="mt-2 text-sm text-gray-500">
              Your password has been reset successfully. You can now login with your new password.
            </p>
            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                className="border-blue-200 bg-blue-300 hover:border-blue-500 hover:bg-blue-400 text-indigo-700"
                onClick={() => window.location.href = '/login'}
              >
                Go to login
              </Button>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium shadow-sm">
                {error.message}
              </div>
            )}
            
            <div className="mb-6 text-sm text-gray-600">
              Enter your new password below. Make sure it&#39;s at least 8 characters and includes uppercase, lowercase, numbers, and special characters.
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-indigo-700 mb-1">
                  New Password
                </label>
                <PasswordInput
                  id="password" 
                  autoComplete="new-password"
                  className="border-blue-200 bg-white hover:border-blue-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-indigo-700 mb-1">
                  Confirm Password
                </label>
                <PasswordInput
                  id="confirmPassword"
                  autoComplete="new-password"
                  className="border-blue-200 bg-white hover:border-blue-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                variant="default"
                className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all duration-200 hover:shadow-lg"
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </form>
          </>
        )}
      </Card>
    </AuthLayout>
  );
}

