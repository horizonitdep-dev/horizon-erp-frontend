/**
 * Every route in the app, in one place. Nothing hardcodes a path string.
 */
export const routes = {
  login: '/login',
  /** Forced on first sign-in while the account still has its seeded password. */
  changePassword: '/change-password',
  hub: '/hub',
  overview: '/overview',
  hr: {
    employees: '/hr/employees',
    newEmployee: '/hr/employees/new',
    editEmployee: (id: string) => `/hr/employees/${id}/edit`,
    cancelledEmployees: '/hr/employees/cancelled',
    /** Keyed by employee — shows that employee's most recent departure record. */
    departure: (employeeId: string) => `/hr/employees/${employeeId}/departure`,
  },
  operations: {
    master: '/operations/master',
    /** "Worker" in the UI; the API calls the same thing an employee. */
    worker: (id: string) => `/operations/workers/${id}`,
    movements: '/operations/movements',
    projects: '/operations/projects',
    newProject: '/operations/projects/new',
    project: (id: string) => `/operations/projects/${id}`,
    editProject: (id: string) => `/operations/projects/${id}/edit`,
    dailyReport: '/operations/daily-report',
  },
} as const;

/** Routes reachable without a session. Everything else is behind the shell. */
export const PUBLIC_ROUTES: readonly string[] = [routes.login];

/** Where an authenticated user lands after signing in, and from /login. */
export const AFTER_LOGIN = routes.hub;
