'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { setTokens } from '@/core/auth/token-store';
import { queryKeys } from '@/core/config/query-keys';
import { AFTER_LOGIN } from '@/core/config/routes';
import { changePassword } from '../api/auth.api';
import type { ChangePasswordPayload, LoginResponse } from '../types';

/**
 * The server revokes every session and issues a fresh pair, so the new tokens
 * must replace the old ones immediately or the next request would 401. The
 * returned user has mustChangePassword cleared, which releases the app.
 */
export function useChangePassword() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, unknown, ChangePasswordPayload>({
    mutationFn: changePassword,
    onSuccess: (data) => {
      // No `remember`: the refresh token stays in whichever store it was in.
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      queryClient.setQueryData(queryKeys.auth.me, data.user);
      toast.success('Password changed');
      router.replace(AFTER_LOGIN);
    },
  });
}
