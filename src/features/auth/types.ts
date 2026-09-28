import type { Department, Level } from '@/core/config/access';

/**
 * ✅ CONFIRMED against the running backend (HIRS API 1.0, /api/docs-json).
 *
 * The user is `fullName`, not first/last — the API has no split name field, so
 * nothing here invents one. Initials come from splitting fullName on display.
 *
 * Access is department plus level (HIRS_Roles_And_Users.md); there is no
 * single `role` any more.
 */

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  /** As printed on the organisational chart. Display only. */
  jobTitle: string;
  department: Department;
  level: Level;
  /**
   * Every seeded account starts with a known password. While this is true the
   * app shows nothing but the change-password screen.
   */
  mustChangePassword: boolean;
  /** Present on /auth/login, absent from /auth/me. */
  reportsToId?: string | null;
  isActive?: boolean;
  lastLoginAt?: string | null;
}

export interface LoginResponse {
  /** JWT, 15 minute lifetime. */
  accessToken: string;
  /**
   * Opaque (not a JWT), 30 day lifetime, and the server does NOT rotate it —
   * /auth/refresh returns the same value and the old one stays valid.
   */
  refreshToken: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
