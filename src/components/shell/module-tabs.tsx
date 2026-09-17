'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { modulesForRole, moduleIdForPath } from '@/core/config/modules';
import { useSession } from '@/features/auth/hooks/use-session';

/**
 * DESIGN.md §7 SHELL. 50px, frosted, 2.5px gradient underline on the active tab.
 *
 * Every department the role can see renders. The four not built this sprint
 * render as spans — visible, plainly not going anywhere, and not a link that
 * 404s.
 */
export function ModuleTabs() {
  const pathname = usePathname();
  const { role } = useSession();

  const modules = modulesForRole(role);
  const activeId = moduleIdForPath(pathname);

  return (
    <nav className="hirs-tabs" aria-label="Departments">
      {modules.map((module) =>
        module.active ? (
          <Link
            key={module.id}
            href={module.href}
            data-active={module.id === activeId}
            aria-current={module.id === activeId ? 'page' : undefined}
          >
            {module.label}
          </Link>
        ) : (
          <span key={module.id} className="tab-inactive" title="Coming soon">
            {module.label}
          </span>
        ),
      )}
    </nav>
  );
}
