'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { setTokens } from '@/core/auth/token-store';
import { queryKeys } from '@/core/config/query-keys';
import { AFTER_LOGIN } from '@/core/config/routes';
import { apiMessage } from '@/core/api/unwrap';
import { login } from '../api/auth.api';
import type { LoginPayload, LoginResponse } from '../types';

/** `remember` never reaches the API — it picks the refresh token's storage. */
type SignInVariables = LoginPayload & { remember: boolean };

export function useLogin(redirectTo?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<LoginResponse, unknown, SignInVariables>({
    mutationFn: ({ email, password }) => login({ email, password }),
    onSuccess: (data, variables) => {
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        remember: variables.remember,
      });
      // Seed the session so the hub renders without a second round trip.
      queryClient.setQueryData(queryKeys.auth.me, data.user);
      router.replace(safeRedirect(redirectTo));
    },
  });

  return {
    signIn: mutation.mutate,
    isPending: mutation.isPending,
    /** The envelope's own message — a rejected sign-in explains itself. */
    error: mutation.error ? apiMessage(mutation.error, 'Could not sign you in. Try again.') : null,
    reset: mutation.reset,
  };
}

/**
 * Only ever return to a path inside this app. A `next` param arrives from the
 * URL, so an absolute or protocol-relative value would be an open redirect.
 */
function safeRedirect(target: string | undefined): string {
  if (!target) return AFTER_LOGIN;
  if (!target.startsWith('/') || target.startsWith('//')) return AFTER_LOGIN;
  return target;
}
