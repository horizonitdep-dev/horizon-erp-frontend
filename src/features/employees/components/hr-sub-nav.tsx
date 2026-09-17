'use client';

import { routes } from '@/core/config/routes';
import { SubNav, type SubNavItem } from '@/components/shell/sub-nav';
import { useEmployeeStats } from '../hooks/use-employees';

/**
 * HR sub-nav — guide §6.4. Current and Cancelled employees navigate; the rest
 * render with their count pill and do nothing. Counts are real, from the API,
 * and render `—` until it provides them.
 */

/** A departure record belongs to the Cancelled tab, even though it nests under an employee. */
const isCancelledRoute = (pathname: string) =>
  pathname === routes.hr.cancelledEmployees || pathname.endsWith('/departure');

export function HrSubNav() {
  const { data } = useEmployeeStats();

  const items: SubNavItem[] = [
    {
      label: 'Current employees',
      href: routes.hr.employees,
      count: data?.currentEmployees ?? data?.totalActive ?? undefined,
      isActive: (pathname) =>
        (pathname === routes.hr.employees || pathname.startsWith(`${routes.hr.employees}/`)) &&
        !isCancelledRoute(pathname),
    },
    {
      label: 'Cancelled employees',
      href: routes.hr.cancelledEmployees,
      count: data?.cancelledEmployees ?? undefined,
      isActive: isCancelledRoute,
    },
    { label: 'Horizon docs', count: data?.horizonDocs ?? undefined, alert: true },
    { label: 'Letter reference', count: data?.letterReference ?? undefined },
    { label: 'Attendance' },
  ];

  return <SubNav items={items} label="HR sections" />;
}
