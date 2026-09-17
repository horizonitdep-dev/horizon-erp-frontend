'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/core/config/routes';
import { refreshAccessToken } from '@/core/auth/refresh';
import { useAuthStore } from '@/core/auth/token-store';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/states';
import { useSession } from '../hooks/use-session';

/**
 * Gates the protected shell — guide §5.
 *
 * The shell renders only once the boot-time refresh has settled and a session
 * exists. That ordering is the whole point: rendering first and reacting to a
 * 401 afterwards is failure mode 3, the reload that bounces you to /login.
 *
 * A failed refresh is not automatically a sign-out. If the server was simply
 * unreachable the tokens are intact, so this offers a retry instead of
 * redirecting — sending the user to /login while the presence cookie is still
 * set would bounce them straight back here and spin forever.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isBootstrapping, isLoading } = useSession();
  const hasAccessToken = useAuthStore((s) => s.hasAccessToken);
  const isServerUnreachable = useAuthStore((s) => s.isServerUnreachable);

  const unreachable = !isBootstrapping && !hasAccessToken && isServerUnreachable;
  const settledWithoutSession = !isBootstrapping && !hasAccessToken && !isServerUnreachable;

  useEffect(() => {
    if (settledWithoutSession) {
      router.replace(routes.login);
    }
  }, [settledWithoutSession, router]);

  if (unreachable) return <ServerUnreachable />;
  if (isLoading || settledWithoutSession) return <BootScreen />;

  return <>{children}</>;
}

/** The session is probably fine; the server is not answering. */
function ServerUnreachable() {
  const setServerUnreachable = useAuthStore((s) => s.setServerUnreachable);
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = async () => {
    setIsRetrying(true);
    try {
      await refreshAccessToken();
      setServerUnreachable(false);
    } catch {
      // Still down. The message on screen already says so.
    } finally {
      setBootstrapping(false);
      setIsRetrying(false);
    }
  };

  return (
    <div className="boot-screen">
      <div className="boot-panel panel">
        <ErrorState
          title="Cannot reach the server"
          message="Your session is still valid. This is the HIRS API not answering — try again once it is back."
          action={
            <Button variant="ghost" onClick={retry} disabled={isRetrying}>
              {isRetrying ? 'Trying…' : 'Try again'}
            </Button>
          }
        />
      </div>
    </div>
  );
}

/**
 * Deliberately near-empty. This is on screen for the length of one refresh
 * call; a skeleton of a layout the user has not asked for yet would flash.
 */
function BootScreen() {
  return (
    <div className="boot-screen" role="status" aria-live="polite">
      <span className="hirs-spark">H</span>
      <span className="sr-only">Signing you in…</span>
    </div>
  );
}
