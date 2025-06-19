'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail, isLoading } = useAuth();
  const [verificationState, setVerificationState] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [hasAttemptedVerification, setHasAttemptedVerification] = useState<boolean>(false);

  // Extract token only once when the component mounts
  useEffect(() => {
    let extractedToken = '';

    // Try to get from URL hash (fragment) first
    if (typeof window !== 'undefined') {
      // The hash part starts with #, so remove it if present
      const hash = window.location.hash;
      if (hash.includes('token=')) {
        extractedToken = hash.split('token=')[1].split('&')[0];
      }
    }

    // If not in hash, try search params
    if (!extractedToken) {
      extractedToken = searchParams.get('token') || '';
    }

    setToken(extractedToken);

    if (!extractedToken) {
      setVerificationState('error');
      setErrorMessage('No verification token found in the URL');
    } else {
      // Only attempt verification automatically once when component mounts
      handleVerification(extractedToken);
    }
    // This effect should only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerification = async (tokenToVerify: string) => {
    if (!tokenToVerify || hasAttemptedVerification) return;

    setHasAttemptedVerification(true);
    setVerificationState('verifying');

    try {
      await verifyEmail(tokenToVerify);
      setVerificationState('success');
      // Wait a bit before redirecting to login page
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      console.error('Email verification error:', err);
      setVerificationState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to verify email');
    }
  };

  // Handle retry button click
  const handleRetry = () => {
    setHasAttemptedVerification(false); // Reset attempt flag
    handleVerification(token); // Try verification again
  };

  return (
    <AuthLayout
      title={
        verificationState === 'verifying' ? 'Verifying Your Email...' :
        verificationState === 'success' ? 'Email Verified Successfully!' :
        'Verification Failed'
      }
      subtitle={
        verificationState === 'success' ? 'Redirecting to login...' :
        verificationState === 'error' ? 'Please try again' :
        'Please wait'
      }
      alternateLink={{
        text: 'return to login',
        href: '/login',
        description: 'return to login page'
      }}
      bgClass="bg-gradient-to-b from-indigo-50 to-blue-50"
    >
      <div className="p-8 bg-white rounded-lg shadow-md text-center">
        {verificationState === 'verifying' && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p>Verifying your email address...</p>
          </div>
        )}

        {verificationState === 'success' && (
          <div className="flex flex-col items-center">
            <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">Email Verified!</h2>
            <p className="text-gray-700">Your email has been successfully verified. You can now log in to your account.</p>
            <p className="text-sm text-gray-500 mt-4">
              You will be redirected to the login page in a few seconds...
            </p>
          </div>
        )}

        {verificationState === 'error' && (
          <div className="flex flex-col items-center">
            <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Verification Failed</h2>
            <p className="mb-4 text-gray-700">
              We couldn&#39;t verify your email address. The verification link may have expired or is invalid.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Error: {errorMessage || 'Unknown error'}
            </p>

            {/* Add retry button */}
            {token && (
              <button
                onClick={handleRetry}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
              >
                {isLoading ? 'Retrying...' : 'Retry Verification'}
              </button>
            )}
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
