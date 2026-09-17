/**
 * Every route in the app, in one place. Nothing hardcodes a path string.
 */
export const routes = {
  login: '/login',
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
} as const;

/** Routes reachable without a session. Everything else is behind the shell. */
export const PUBLIC_ROUTES: readonly string[] = [routes.login];

/** Where an authenticated user lands after signing in, and from /login. */
export const AFTER_LOGIN = routes.hub;
