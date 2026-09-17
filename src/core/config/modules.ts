import type { UserRole } from './roles';
import { isExecutive } from './roles';
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
  /** Roles that see this module at all. Executives see everything. */
  roles: readonly UserRole[];
};

export const MODULES: readonly ModuleDefinition[] = [
  {
    id: 'overview',
    label: 'Overview',
    href: routes.overview,
    description: 'Everything across the group, in one place.',
    active: true,
    roles: ['CHAIRMAN', 'MD', 'HR', 'BUSINESS', 'OPERATIONS', 'FINANCE', 'IT'],
  },
  {
    id: 'hr',
    label: 'HR',
    href: routes.hr.employees,
    description: 'People, documents and deployment.',
    active: true,
    roles: ['CHAIRMAN', 'MD', 'HR'],
  },
  {
    id: 'business',
    label: 'Business',
    href: '/business',
    description: 'Clients, contracts and manager pipelines.',
    active: false,
    roles: ['CHAIRMAN', 'MD', 'BUSINESS'],
  },
  {
    id: 'operations',
    label: 'Operations',
    href: '/operations',
    description: 'Sites, camps and daily deployment.',
    active: false,
    roles: ['CHAIRMAN', 'MD', 'OPERATIONS'],
  },
  {
    id: 'finance',
    label: 'Finance',
    href: '/finance',
    description: 'Invoicing, payroll and margins.',
    active: false,
    roles: ['CHAIRMAN', 'MD', 'FINANCE'],
  },
  {
    id: 'it',
    label: 'IT',
    href: '/it',
    description: 'Assets, accounts and access.',
    active: false,
    roles: ['CHAIRMAN', 'MD', 'IT'],
  },
];

/** Modules a role may see. Executives see all six. */
export function modulesForRole(role: UserRole | null | undefined): readonly ModuleDefinition[] {
  if (isExecutive(role)) return MODULES;
  if (!role) return MODULES.filter((m) => m.id === 'overview');
  return MODULES.filter((m) => m.roles.includes(role));
}

/** Which module a pathname belongs to, for tab highlighting. */
export function moduleIdForPath(pathname: string): ModuleId | null {
  if (pathname.startsWith(routes.overview)) return 'overview';
  const match = MODULES.find((m) => m.id !== 'overview' && pathname.startsWith(`/${m.id}`));
  return match?.id ?? null;
}
