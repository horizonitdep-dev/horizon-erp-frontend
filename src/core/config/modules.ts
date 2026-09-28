import { isExecutive, type AccessSubject, type Department } from './access';
import { routes } from './routes';

/**
 * The department registry — the single line that changes when a module ships.
 *
 * Adding Operations means flipping `active` here and creating
 * features/operations/ + app/(app)/operations/. Nothing else is touched;
 * if adding a module needs an edit inside another module, the boundary is wrong.
 */

export type ModuleId = 'overview' | 'hr' | 'business' | 'operations' | 'finance' | 'it';

export type ModuleDefinition = {
  id: ModuleId;
  /** Tab and hub-card label. Sentence case (DESIGN.md §12). */
  label: string;
  href: string;
  /** One line under the hub card title. */
  description: string;
  /** Built this sprint. Inactive modules render visible but do not navigate. */
  active: boolean;
  /** Departments that see this module at all. Executives see everything. */
  departments: readonly Department[];
};

export const MODULES: readonly ModuleDefinition[] = [
  {
    id: 'overview',
    label: 'Overview',
    href: routes.overview,
    description: 'Everything across the group, in one place.',
    active: true,
    departments: ['EXECUTIVE', 'BUSINESS', 'OPERATIONS', 'HR_ADMIN', 'PR', 'ACCOUNTS', 'IT'],
  },
  {
    id: 'hr',
    label: 'HR',
    href: routes.hr.employees,
    description: 'People, documents and deployment.',
    active: true,
    // Operations too: their officers transcribe airport clearance on HR's
    // departure form, and need a way in without typing a URL.
    departments: ['HR_ADMIN', 'OPERATIONS'],
  },
  {
    id: 'business',
    label: 'Business',
    href: '/business',
    description: 'Clients, contracts and manager pipelines.',
    active: false,
    departments: ['BUSINESS'],
  },
  {
    id: 'operations',
    label: 'Operations',
    href: routes.operations.master,
    description: 'Sites, camps and daily deployment.',
    active: true,
    departments: ['OPERATIONS'],
  },
  {
    id: 'finance',
    label: 'Finance',
    href: '/finance',
    description: 'Invoicing, payroll and margins.',
    active: false,
    // The chart calls the department Accounts; the module keeps its Finance tab.
    departments: ['ACCOUNTS'],
  },
  {
    id: 'it',
    label: 'IT',
    href: '/it',
    description: 'Assets, accounts and access.',
    active: false,
    departments: ['IT'],
  },
];

/**
 * Modules a user may see. Executives see all six.
 *
 * ⚠️ PR is a real department with no module of its own (open question), so PR
 * staff see Overview only.
 */
export function modulesFor(user: AccessSubject | null | undefined): readonly ModuleDefinition[] {
  if (isExecutive(user)) return MODULES;
  if (!user) return MODULES.filter((m) => m.id === 'overview');
  return MODULES.filter((m) => m.departments.includes(user.department));
}

/** Which module a pathname belongs to, for tab highlighting. */
export function moduleIdForPath(pathname: string): ModuleId | null {
  if (pathname.startsWith(routes.overview)) return 'overview';
  const match = MODULES.find((m) => m.id !== 'overview' && pathname.startsWith(`/${m.id}`));
  return match?.id ?? null;
}
