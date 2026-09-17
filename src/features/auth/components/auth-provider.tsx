'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { onSessionEnded } from '@/core/api/client';
import { refreshAccessToken } from '@/core/auth/refresh';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  secondsUntilExpiry,
  useAuthStore,
} from '@/core/auth/token-store';
import { PUBLIC_ROUTES, routes } from '@/core/config/routes';

/**
 * Owns the session lifecycle — guide §5.
 *
 *  1. On boot, refresh before the protected shell renders. This alone kills
 *     failure mode 3: an app that reads a stale token from storage, sends it,
 *     gets a 401 and bounces the user to /login.
 *  2. Proactively refresh ~60s before the access token lapses, so a user
 *     mid-form never sees a request fail at all.
 *  3. When the session genuinely ends, clear the cache and go to /login.
 */

/** How long before expiry to refresh. */
const REFRESH_LEAD_SECONDS = 60;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping);
  const setServerUnreachable = useAuthStore((s) => s.setServerUnreachable);
  const hasAccessToken = useAuthStore((s) => s.hasAccessToken);

  // Boot-time refresh. Runs once, and always settles isBootstrapping so the
  // app can never hang on a spinner.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    const run = async () => {
      if (!getRefreshToken()) {
        // No session to restore. Clear the presence cookie too, or the proxy
        // will keep bouncing /login back to the shell.
        clearTokens();
        setBootstrapping(false);
        return;
      }
      try {
        await refreshAccessToken();
        setServerUnreachable(false);
      } catch {
        // refresh.ts clears the tokens only when the server actually refused.
        // If they survived, the failure was transient — the server is down or
        // unreachable — and the session is still valid once it returns. Say so
        // rather than pretending the user is signed out.
        setServerUnreachable(!!getRefreshToken());
      } finally {
        setBootstrapping(false);
      }
    };

    void run();
  }, [setBootstrapping, setServerUnreachable]);

  // Proactive refresh, rescheduled each time the token changes.
  useEffect(() => {
    if (!hasAccessToken) return;

    const seconds = secondsUntilExpiry(getAccessToken());
    if (seconds === null) return; // Opaque token: rely on the 401 path instead.

    const delayMs = Math.max(0, (seconds - REFRESH_LEAD_SECONDS) * 1000);
    const timer = setTimeout(() => {
      void refreshAccessToken().catch(() => {
        // A failure here is not fatal — the 401 interceptor is still the
        // backstop, and a refused refresh ends the session through it.
      });
    }, delayMs);

    return () => clearTimeout(timer);
  }, [hasAccessToken]);

  // The session ended for real. Only a refused refresh or an explicit sign-out
  // reaches this — never a network error or a 5xx.
  useEffect(() => {
    return onSessionEnded(() => {
      queryClient.clear();
      if (!PUBLIC_ROUTES.includes(pathname)) {
        router.replace(routes.login);
      }
    });
  }, [pathname, queryClient, router]);

  return <>{children}</>;
}
