'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { ChangePasswordFormRequest, changePasswordSchema } from '@/lib/schemas';
import { useAuth } from "@/hooks";

interface ChangePasswordProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ChangePasswordForm({ onSuccess, onCancel }: Readonly<ChangePasswordProps>) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { changePassword, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormRequest>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormRequest) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setIsSubmitted(true);
      reset();
      setTimeout(() => {
        setIsSubmitted(false);
        if (onSuccess) onSuccess();
      }, 3000);
    } catch (err) {
      console.error('Change password error:', err);
      setError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  return (
    <Card className="w-full p-4 sm:p-6 border border-blue-100 bg-white overflow-hidden">
      {isSubmitted ? (
        <div className="text-center py-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-3 text-lg font-medium text-gray-900">Password changed successfully</h3>
          <p className="text-sm text-gray-500 mt-1">Returning to profile...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium shadow-sm">
              {error}
            </div>
          )}
          
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-indigo-700 mb-1">
                Current Password
              </label>
              <PasswordInput
                id="currentPassword" 
                autoComplete="current-password"
                className="border-blue-200 bg-white hover:border-blue-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black w-full"
                error={errors.currentPassword?.message}
                {...register('currentPassword')}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-indigo-700 mb-1">
                New Password
              </label>
              <PasswordInput
                id="newPassword" 
                autoComplete="new-password"
                className="border-blue-200 bg-white hover:border-blue-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black w-full"
                error={errors.newPassword?.message}
                {...register('newPassword')}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-indigo-700 mb-1">
                Confirm New Password
              </label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                className="border-blue-200 bg-white hover:border-blue-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black w-full"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:space-x-3 pt-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="border-gray-200 text-white hover:bg-gray-100 w-full sm:w-auto"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                variant="default"
                className="bg-indigo-600 hover:bg-indigo-700 shadow-sm w-full sm:w-auto"
              >
                {isLoading ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </>
      )}
    </Card>
  );
}
