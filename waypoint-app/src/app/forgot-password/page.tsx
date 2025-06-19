'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';  // Changed from useUser to useAuth
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ForgotPasswordFormRequest, forgotPasswordSchema } from '@/lib/schemas';

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { forgotPassword, isLoading, error } = useAuth();  // Changed from useUser to useAuth
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormRequest>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormRequest) => {
    try {
      await forgotPassword({ email: data.email });
      setIsSubmitted(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      // Even on error, we don't want to reveal if the email exists or not
      setIsSubmitted(true);
    }
  };

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
            <h3 className="mt-3 text-lg font-medium text-gray-900">Check your email</h3>
            <p className="mt-2 text-sm text-gray-500">
              If an account exists with that email, we&#39;ve sent password reset instructions to it.
            </p>
            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                className="border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-indigo-700"
                onClick={() => window.location.href = '/login'}
              >
                Return to login
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
              Enter the email address associated with your account, and we&#39;ll email you a link to reset your password.
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-indigo-700 mb-1">
                  Email address
                </label>
                <div>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`border-blue-200 bg-white hover:border-blue-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black ${
                      errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                    }`}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                variant="default"
                className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all duration-200 hover:shadow-lg"
              >
                {isLoading ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          </>
        )}
      </Card>
    </AuthLayout>
  );
}
