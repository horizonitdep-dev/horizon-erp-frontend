/**
 * Access — department plus seniority (HIRS_Roles_And_Users.md). Replaced the
 * flat Sprint 1 UserRole list.
 *
 * Mirrors the backend's `auth/access.ts` (the mechanism) and each module's
 * `*.access.ts` (the rules) — `hr/employees/employees.access.ts`,
 * `hr/departures/departures.access.ts`, `users/users.access.ts`. This is
 * presentation, not security: the API enforces every rule and returns 403
 * regardless. The mirror exists so people are not offered controls that will
 * only be refused.
 *
 * Lives in core/ because module tabs, hub cards and feature gates all key off
 * it, and core/ must never import a feature.
 */

export const DEPARTMENTS = [
  'EXECUTIVE',
  'BUSINESS',
  'OPERATIONS',
  'HR_ADMIN',
  'PR',
  'ACCOUNTS',
  'IT',
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const DEPARTMENT_LABELS: Record<Department, string> = {
  EXECUTIVE: 'Executive',
  BUSINESS: 'Business',
  OPERATIONS: 'Operations',
  HR_ADMIN: 'HR & Admin',
  PR: 'PR',
  ACCOUNTS: 'Accounts',
  IT: 'IT',
};

/** Most senior first. */
export const LEVELS = ['EXECUTIVE', 'HEAD', 'SENIOR', 'OFFICER', 'STAFF'] as const;
export type Level = (typeof LEVELS)[number];

/** Levels are ordered, so `minLevel` means "this level or above". */
export const LEVEL_RANK: Record<Level, number> = {
  STAFF: 0,
  OFFICER: 1,
  SENIOR: 2,
  HEAD: 3,
  EXECUTIVE: 4,
};

export interface AccessRule {
  departments: readonly Department[];
  /** This level or above. */
  minLevel?: Level;
  /**
   * This level or below — "anyone below the head". Executives do NOT pass a
   * rule with a maxLevel: it says who does the work, not who is senior enough.
   */
  maxLevel?: Level;
}

export interface AccessSubject {
  department: Department;
  level: Level;
}

/**
 * 1. EXECUTIVE level passes everything, unless the rule sets a maxLevel.
 * 2. Otherwise the department must be in the rule.
 * 3. And the level must rank at or above `minLevel`, and at or below `maxLevel`.
 */
export function hasAccess(user: AccessSubject | null | undefined, rule: AccessRule): boolean {
  if (!user) return false;
  if (user.level === 'EXECUTIVE' && !rule.maxLevel) return true;
  if (!rule.departments.includes(user.department)) return false;

  const rank = LEVEL_RANK[user.level];
  if (rule.minLevel && rank < LEVEL_RANK[rule.minLevel]) return false;
  if (rule.maxLevel && rank > LEVEL_RANK[rule.maxLevel]) return false;

  return true;
}

/**
 * Passing ANY of the rules is enough — mirrors the backend's `hasAnyAccess`.
 *
 * Needed because some actions are open to two departments at different
 * seniorities: editing a project is Operations at HEAD or Business at SENIOR,
 * since most projects arrive through B.D. One rule cannot say that, because a
 * single `departments` list shares one `minLevel`.
 */
export function hasAnyAccess(
  user: AccessSubject | null | undefined,
  rules: readonly AccessRule[],
): boolean {
  return rules.some((rule) => hasAccess(user, rule));
}

export function isExecutive(user: AccessSubject | null | undefined): boolean {
  return user?.level === 'EXECUTIVE';
}

/** Every rule the API enforces — same names as the backend's ACCESS. */
export const ACCESS = {
  employeeWrite: { departments: ['HR_ADMIN'], minLevel: 'OFFICER' },
  employeeCancel: { departments: ['HR_ADMIN'], minLevel: 'SENIOR' },
  employeeReinstate: { departments: ['HR_ADMIN'], minLevel: 'SENIOR' },
  departureHrSection: { departments: ['HR_ADMIN'], minLevel: 'OFFICER' },
  /** Save and submit clearance — Operations below the Operations Manager. No HR, no executives. */
  departureClearanceWrite: { departments: ['OPERATIONS'], maxLevel: 'SENIOR' },
  /** Approve or reject clearance — the Operations Manager (executives pass too). */
  departureClearanceReview: { departments: ['OPERATIONS'], minLevel: 'HEAD' },
  departureApprove: { departments: ['HR_ADMIN'], minLevel: 'HEAD' },
  userAdmin: { departments: ['IT'], minLevel: 'HEAD' },

  // ── Operations (module guide §11 — provisional) ──
  /** Read anything in Operations. Executives pass every rule anyway. */
  operationsRead: { departments: ['OPERATIONS'] },
  /** Move people, place them for the first time, finish a project. */
  operationsMove: { departments: ['OPERATIONS'], minLevel: 'OFFICER' },
  /** Narrower than moving: undo deletes a placement, so it is the manager's. */
  operationsUndo: { departments: ['OPERATIONS'], minLevel: 'HEAD' },
  /** The typed-in parts of the daily report — camp, vehicles, arrivals. */
  operationsDailyWrite: { departments: ['OPERATIONS'], minLevel: 'OFFICER' },
  /** A new trade is a new column on the daily report. */
  operationsTradeWrite: { departments: ['OPERATIONS'], minLevel: 'HEAD' },
  /**
   * Trades are shared reference data, not Operations' private list — HR picks
   * a designation from the same one, so reading is deliberately wider.
   */
  tradeRead: { departments: ['OPERATIONS', 'HR_ADMIN'] },
} as const satisfies Record<string, AccessRule>;

/**
 * Rules that need more than one clause. `ACCESS` holds single rules so that
 * `<AccessGate rule={…}>` stays a one-liner; these go through `hasAnyAccess`.
 */
export const ACCESS_ANY = {
  /** Operations heads, or Business seniors — most projects arrive through B.D. */
  operationsProjectWrite: [
    { departments: ['OPERATIONS'], minLevel: 'HEAD' },
    { departments: ['BUSINESS'], minLevel: 'SENIOR' },
  ],
} as const satisfies Record<string, readonly AccessRule[]>;

export type ApprovalSlot = 'HR' | 'MD';

/**
 * Which signature box on the departure form a person signs — mirrors the
 * backend's approvalSlot(). HR & Admin heads sign "HR Manager"; executives
 * sign "Managing Director".
 */
export function approvalSlot(user: AccessSubject | null | undefined): ApprovalSlot | null {
  if (!user) return null;
  if (user.level === 'EXECUTIVE') return 'MD';
  if (user.department === 'HR_ADMIN' && user.level === 'HEAD') return 'HR';
  return null;
}
