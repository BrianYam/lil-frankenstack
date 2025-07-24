'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useState, useEffect } from 'react';
import { setupAuthInvalidations } from '@/hooks'

interface ApiProviderProps {
  children: ReactNode;
}

/**
 * API Provider that sets up React Query
 * This provider should wrap the app to provide API functionality
 */
export function ApiProvider({ children }: Readonly<ApiProviderProps>) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });
    
    return client;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setupAuthInvalidations(queryClient);
    }
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
