'use client';

import { routes } from '@/core/config/routes';
import { SubNav, type SubNavItem } from '@/components/shell/sub-nav';
import { useSummary } from '../hooks/use-operations';

/**
 * Operations sub-nav. The first four navigate; the rest render with their
 * count pill and do nothing, because those modules are not built.
 *
 * "Which Operations screen" is what this control means. Which GROUP of workers
 * you are looking at is a different question and gets its own row of pills on
 * the master list, so the two never look interchangeable.
 */
export function OperationsSubNav() {
  const { data } = useSummary();

  const items: SubNavItem[] = [
    {
      label: 'Master list',
      href: routes.operations.master,
      count: data?.totals.includingMarkup.count ?? undefined,
      isActive: (pathname) =>
        pathname === routes.operations.master || pathname.startsWith('/operations/workers'),
    },
    { label: 'Daily reports', href: routes.operations.dailyReport },
    { label: 'Mobilization', href: routes.operations.movements },
    {
      label: 'Projects',
      href: routes.operations.projects,
      isActive: (pathname) => pathname.startsWith(routes.operations.projects),
    },
    { label: 'Timesheets' },
    { label: 'Welfare' },
    { label: 'Camps' },
    { label: 'Transport' },
    { label: 'ADNOC Medical' },
  ];

  return <SubNav items={items} label="Operations sections" />;
}
