'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/features/auth/components/auth-provider';
import { isNetworkError, statusOf } from '@/core/api/unwrap';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // A 4xx will not become a 2xx by asking again. Retry only the
              // things that genuinely might resolve: network blips and 5xx.
              const status = statusOf(error);
              if (status !== null && status >= 400 && status < 500) return false;
              return failureCount < 2;
            },
          },
          mutations: {
            retry: (failureCount, error) => isNetworkError(error) && failureCount < 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        {/* Sonner ships its own palette; these are our tokens, not new values. */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--card)',
              border: '1px solid var(--line)',
              color: 'var(--ink)',
              borderRadius: 'var(--r-2xl)',
              boxShadow: 'var(--sh-card)',
              fontFamily: 'var(--font-inter)',
              fontSize: '13.5px',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
