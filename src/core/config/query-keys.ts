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
} as const;
