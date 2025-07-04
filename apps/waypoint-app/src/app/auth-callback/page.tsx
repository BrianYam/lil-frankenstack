'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';

/**
 * AuthCallbackPage
 *
 * This page handles OAuth callbacks from providers like Google.
 * It extracts the token from the URL hash fragment and exchanges it
 * for proper authentication by calling the backend's complete-oauth endpoint.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { completeOAuthAuthentication, isLoading, error } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        // Extract token from hash fragment (URL format: /auth-callback#token=abc123)
        const hash = window.location.hash;
        const token = hash.replace('#token=', '');

        if (!token) {
          setStatus('error');
          setErrorMessage('Authentication token not found in URL');
          return;
        }

        console.log('Completing OAuth authentication with token from URL');

        // Use the auth hook to complete the authentication
        await completeOAuthAuthentication(token);

        setStatus('success');

        // Redirect to the main profile page after successful authentication
        router.push('/me');
      } catch (err) {
        console.error('Authentication error:', err);
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Authentication failed');
      }
    }

    handleAuthCallback();
  }, [completeOAuthAuthentication, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-50">
        <h1 className="text-2xl font-bold mb-4 text-gray-700">Completing your sign in...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-3 border-b-3 border-blue-400"></div>
      </div>
    );
  }

  if (status === 'error' || error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-50">
        <h1 className="text-2xl font-bold mb-4 text-red-500">Authentication Failed</h1>
        <p className="text-red-500 mb-4">{errorMessage || (error instanceof Error ? error.message : 'An error occurred')}</p>
        <button
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
          onClick={() => router.push('/login')}
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-50">
      <h1 className="text-2xl font-bold mb-4 text-green-500">Authentication Successful</h1>
      <p className="mb-4">Redirecting you to your profile...</p>
    </div>
  );
}
