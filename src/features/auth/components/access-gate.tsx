'use client';

import { hasAccess, type AccessRule } from '@/core/config/access';
import { useSession } from '../hooks/use-session';

/**
 * Renders its children only for people an access rule lets through — the same
 * rule object the API enforces (core/config/access.ts → ACCESS).
 *
 * This is presentation, not security — the API enforces every rule with
 * @Access() and returns 403 regardless of what the UI shows. The gate exists
 * so people are not offered controls that will only be refused.
 */
export function AccessGate({
  rule,
  children,
  fallback = null,
}: {
  rule: AccessRule;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user } = useSession();
  return <>{hasAccess(user, rule) ? children : fallback}</>;
}

/** The same check as a value, for a control that is disabled rather than hidden. */
export function useCanAccess(rule: AccessRule): boolean {
  const { user } = useSession();
  return hasAccess(user, rule);
}
