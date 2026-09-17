/**
 * ⚠️ CONFIRM 1 (guide §4) — these must match the Prisma role enum character
 * for character. Nothing here is verified against a backend yet; the values
 * are the ones the guide expects, based on the department structure.
 *
 * Roles live in core/ rather than features/auth because module tabs, hub cards
 * and route guards all key off them, and core/ must never import a feature.
 */
export const USER_ROLES = [
  'CHAIRMAN',
  'MD',
  'HR',
  'BUSINESS',
  'OPERATIONS',
  'FINANCE',
  'IT',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

/** Roles that see every department, not just their own. */
export const EXECUTIVE_ROLES: readonly UserRole[] = ['CHAIRMAN', 'MD'];

export function isExecutive(role: UserRole | null | undefined): boolean {
  return !!role && EXECUTIVE_ROLES.includes(role);
}
