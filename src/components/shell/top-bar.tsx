'use client';

import Link from 'next/link';
import { routes } from '@/core/config/routes';
import { useSession } from '@/features/auth/hooks/use-session';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { initials } from '@/lib/format';
import { BellIcon, SearchIcon } from '@/components/ui/icons';
import { ThemeToggle } from '@/components/ui/theme-toggle';

/**
 * DESIGN.md §7 SHELL. 68px, frosted, with a 1px bottom border.
 *
 * The search field is presentational for this sprint — global search is not in
 * scope, and a box that swallows keystrokes is worse than one that is plainly
 * not ready, so it renders disabled rather than inert.
 */
export function TopBar() {
  const { user } = useSession();
  const { signOut, isPending } = useLogout();

  return (
    <header className="hirs-bar">
      <Link href={routes.hub} className="hirs-logo" aria-label="HIRS home">
        <span className="hirs-spark">H</span>
        <span className="t-logo">HIRS</span>
      </Link>

      <div className="hirs-search" aria-hidden="true">
        <SearchIcon />
        <span>Search</span>
      </div>

      <div className="hirs-bar-right">
        <ThemeToggle />

        <span className="hirs-bell" aria-label="Notifications">
          <BellIcon />
          <i />
        </span>

        <div className="hirs-who">
          <div className="hirs-avatar">{initials(user?.fullName)}</div>
          <div>
            <b>{user?.fullName ?? '—'}</b>
            <span>{user?.jobTitle ?? '—'}</span>
          </div>
        </div>

        <button type="button" className="bar-signout" onClick={signOut} disabled={isPending}>
          {isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </header>
  );
}
