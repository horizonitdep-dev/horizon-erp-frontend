'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EM_DASH, formatCount } from '@/lib/format';

/**
 * DESIGN.md §7 SHELL. Solid card background, 2px orange underline when active.
 *
 * Items carry a count pill. Counts that need attention use `.hirs-count--alert`.
 * A count of `undefined` renders `—` rather than a fabricated zero.
 */

export type SubNavItem = {
  label: string;
  href?: string;
  count?: number | undefined;
  /** Renders the count pill in the warning treatment. */
  alert?: boolean;
  /**
   * Overrides the default prefix match. Needed when one section's routes nest
   * under another's — /hr/employees/cancelled sits under /hr/employees but is
   * not the Current employees tab.
   */
  isActive?: (pathname: string) => boolean;
};

export function SubNav({ items, label }: { items: readonly SubNavItem[]; label: string }) {
  const pathname = usePathname();

  return (
    <nav className="hirs-subnav" aria-label={label}>
      {items.map((item) => {
        const pill = (
          <span className={`hirs-count${item.alert ? ' hirs-count--alert' : ''}`}>
            {item.count === undefined ? EM_DASH : formatCount(item.count)}
          </span>
        );

        // Only the items built this sprint navigate. The rest render with their
        // pill and do nothing, rather than linking somewhere that does not exist.
        if (!item.href) {
          return (
            <span key={item.label} data-disabled="true" title="Coming soon">
              {item.label}
              {pill}
            </span>
          );
        }

        const active = item.isActive
          ? item.isActive(pathname)
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.label}
            href={item.href}
            data-active={active}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
            {pill}
          </Link>
        );
      })}
    </nav>
  );
}
