'use client';

import Link from 'next/link';
import { ACCESS_ANY, hasAnyAccess } from '@/core/config/access';
import { routes } from '@/core/config/routes';
import { ErrorState } from '@/components/ui/states';
import { useSession } from '@/features/auth/hooks/use-session';

/**
 * The add and edit pages are reachable by URL, so they check the same rule the
 * buttons do. The API would refuse the save anyway; this saves filling in a
 * form that cannot be submitted.
 */
export function ProjectWriteGate({ children }: { children: React.ReactNode }) {
  const { user } = useSession();

  if (hasAnyAccess(user, ACCESS_ANY.operationsProjectWrite)) return <>{children}</>;

  return (
    <div className="panel form-panel">
      <ErrorState
        title="You can't change projects"
        message="Adding and editing projects is for Operations heads and senior Business staff."
        action={
          <Link href={routes.operations.projects} className="btn-ghost">
            Back to projects
          </Link>
        }
      />
    </div>
  );
}
