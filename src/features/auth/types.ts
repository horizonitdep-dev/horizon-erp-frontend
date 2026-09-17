import type { UserRole } from '@/core/config/roles';

/**
 * ✅ CONFIRMED against the running backend (HIRS API 1.0, /api/docs-json).
 *
 * The user is `fullName`, not first/last — the API has no split name field, so
 * nothing here invents one. Initials come from splitting fullName on display.
 */

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  /** Present on /auth/login, absent from /auth/me. */
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
