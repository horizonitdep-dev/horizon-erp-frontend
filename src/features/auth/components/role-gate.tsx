'use client';

import type { UserRole } from '@/core/config/roles';
import { useSession } from '../hooks/use-session';

/**
 * Renders its children only for the listed roles.
 *
 * This is presentation, not security — the API enforces every role with
 * @Roles() and returns 403 regardless of what the UI shows. The gate exists so
 * people are not offered controls that will only be refused.
 */
export function RoleGate({
  allow,
  children,
  fallback = null,
}: {
  allow: readonly UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { role } = useSession();
  return <>{role && allow.includes(role) ? children : fallback}</>;
}

/** The same check as a value, for a control that is disabled rather than hidden. */
export function useHasRole(allow: readonly UserRole[]): boolean {
  const { role } = useSession();
  return !!role && allow.includes(role);
}
