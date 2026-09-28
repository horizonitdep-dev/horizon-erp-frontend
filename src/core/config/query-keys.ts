/**
 * TanStack Query keys, centralised so invalidation is never a guess.
 *
 * Hierarchical by design: invalidating `employees.all` clears every list and
 * detail below it, which is what a create, cancel or reinstate needs.
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    summary: (range: string) => ['dashboard', 'summary', range] as const,
  },
  employees: {
    all: ['employees'] as const,
    lists: () => ['employees', 'list'] as const,
    list: (params: Record<string, unknown>) => ['employees', 'list', params] as const,
    details: () => ['employees', 'detail'] as const,
    detail: (id: string) => ['employees', 'detail', id] as const,
    /** Sub-nav counts and the four stat tiles. */
    stats: () => ['employees', 'stats'] as const,
    /** Lookup lists for filters and form selects. Rarely changes. */
    options: () => ['employees', 'options'] as const,
  },
  departures: {
    all: ['departures'] as const,
    list: (params: Record<string, unknown>) => ['departures', 'list', params] as const,
    detail: (id: string) => ['departures', 'detail', id] as const,
    /** An employee's departures, newest first — how the record page finds its row. */
    forEmployee: (employeeId: string) => ['departures', 'employee', employeeId] as const,
  },
  /**
   * One namespace for the whole module, invalidated wholesale after a move: a
   * move changes the master list, the summary, the movement log, the project
   * headcount and the daily report at once. Splitting it finer is how a stale
   * number survives on one screen.
   */
  operations: {
    all: ['operations'] as const,
    master: (params: Record<string, unknown>) => ['operations', 'master', params] as const,
    worker: (id: string) => ['operations', 'worker', id] as const,
    summary: ['operations', 'summary'] as const,
    movements: (params: Record<string, unknown>) => ['operations', 'movements', params] as const,
    projects: (params: Record<string, unknown>) => ['operations', 'projects', params] as const,
    project: (id: string) => ['operations', 'project', id] as const,
    dailyReport: (date: string) => ['operations', 'daily-report', date] as const,
    vehicles: ['operations', 'vehicles'] as const,
    expectedArrivals: (params: Record<string, unknown>) =>
      ['operations', 'expected-arrivals', params] as const,
  },
  /** Shared reference data — HR reads the same list for its designation field. */
  trades: {
    all: ['trades'] as const,
    list: (category?: string) => ['trades', 'list', category ?? 'all'] as const,
  },
} as const;
