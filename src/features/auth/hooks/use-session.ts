'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/core/config/query-keys';
import { useAuthStore } from '@/core/auth/token-store';
import { me } from '../api/auth.api';
import type { AuthUser } from '../types';

/**
 * The current user. Only runs once a live access token exists, so it never
 * fires a doomed request during the boot-time refresh.
 */
export function useSession() {
  const hasAccessToken = useAuthStore((s) => s.hasAccessToken);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);

  const query = useQuery<AuthUser>({
    queryKey: queryKeys.auth.me,
    queryFn: me,
    enabled: hasAccessToken,
    staleTime: 5 * 60 * 1000,
    // A 401 here is handled by the interceptor; retrying would only duplicate.
    retry: false,
  });

  return {
    user: query.data ?? null,
    isBootstrapping,
    isLoading: isBootstrapping || (hasAccessToken && query.isPending),
    isAuthenticated: hasAccessToken && !!query.data,
    error: query.error,
  };
}
