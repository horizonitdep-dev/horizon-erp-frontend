'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { endSession } from '@/core/api/client';
import { logout as logoutRequest } from '../api/auth.api';

/**
 * Explicit sign-out. The local session is cleared whether or not the server
 * call succeeds — a user who clicked "Sign out" is signed out regardless of
 * what the network does.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const signOut = useCallback(async () => {
    setIsPending(true);
    try {
      await logoutRequest();
    } catch {
      // Best effort: revoking server-side is desirable, not required.
    } finally {
      endSession();
      queryClient.clear();
      setIsPending(false);
    }
  }, [queryClient]);

  return { signOut, isPending };
}
