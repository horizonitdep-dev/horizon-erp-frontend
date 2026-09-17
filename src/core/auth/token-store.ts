import { create } from 'zustand';

/**
 * Token storage — guide §5.
 *
 * Access token lives in memory only. It is never written to localStorage:
 * memory plus refresh-on-boot is both safer and more reliable than persisting
 * a token that is usually expired by the time the page reloads.
 *
 * Refresh token lives in localStorage under one key. It is the only thing that
 * survives a reload, and losing a rotated one is a silent logout, so it is
 * written the instant a new one arrives.
 */

const REFRESH_KEY = 'hirs-refresh-token';

/**
 * A presence marker, not a credential — `middleware.ts` runs on the server and
 * can see neither memory nor localStorage, so it needs something in a cookie to
 * make the coarse redirect decision. It holds no token and grants no access;
 * the real guard is the boot-time refresh in AuthProvider.
 */
const SESSION_COOKIE = 'hirs-session';

/**
 * Module-level, so the axios interceptor can read the current token
 * synchronously without going through a React render.
 */
let accessToken: string | null = null;

type AuthState = {
  /** Mirrors `accessToken` for components that need to react to it. */
  hasAccessToken: boolean;
  /** True until the boot-time refresh has settled, either way. */
  isBootstrapping: boolean;
  /**
   * The boot refresh failed for a reason that is not an auth failure — the
   * server was unreachable or unwell. The tokens are still intact, so this is
   * a retry situation, not a sign-out.
   */
  isServerUnreachable: boolean;
  setBootstrapping: (value: boolean) => void;
  setServerUnreachable: (value: boolean) => void;
  setHasAccessToken: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  hasAccessToken: false,
  isBootstrapping: true,
  isServerUnreachable: false,
  setBootstrapping: (value) => set({ isBootstrapping: value }),
  setServerUnreachable: (value) => set({ isServerUnreachable: value }),
  setHasAccessToken: (value) => set({ hasAccessToken: value }),
}));

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  useAuthStore.getState().setHasAccessToken(!!token);
}

/**
 * "Keep me signed in" is a frontend-only choice: the backend's LoginDto rejects
 * any extra property, and its refresh token is 30 days either way. So the
 * checkbox picks the storage instead — localStorage survives the browser
 * closing, sessionStorage dies with the tab.
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string | null, remember = true): void {
  if (typeof window === 'undefined') return;
  try {
    // Always clear both, so switching the choice never leaves a stale copy in
    // the other store for getRefreshToken() to find later.
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    if (token) {
      (remember ? localStorage : sessionStorage).setItem(REFRESH_KEY, token);
    }
  } catch {
    // Blocked storage: the session still works until this tab closes.
  }
}

/** Store both tokens after a login or a refresh. */
export function setTokens(tokens: {
  accessToken: string;
  refreshToken?: string | null;
  remember?: boolean;
}): void {
  setAccessToken(tokens.accessToken);
  // Only overwrite when a refresh token actually arrived. This server does not
  // rotate — /auth/refresh returns the same value — but writing only on arrival
  // is also what keeps a rotating server correct, so the rule holds either way.
  if (tokens.refreshToken) {
    setRefreshToken(tokens.refreshToken, tokens.remember ?? isRemembered());
  }
  markSession(true);
}

/** Which store the refresh token currently lives in, so a refresh keeps it there. */
function isRemembered(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(REFRESH_KEY) !== null;
  } catch {
    return true;
  }
}

export function clearTokens(): void {
  setAccessToken(null);
  setRefreshToken(null);
  markSession(false);
}

function markSession(active: boolean): void {
  if (typeof document === 'undefined') return;
  document.cookie = active
    ? `${SESSION_COOKIE}=1; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`
    : `${SESSION_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;

/**
 * Seconds until the access token expires, read from its `exp` claim.
 * Used only for the proactive refresh timer; nothing security-critical depends
 * on it, so a token we cannot decode simply disables the timer.
 */
export function secondsUntilExpiry(token: string | null = accessToken): number | null {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  const exp = payload?.['exp'];
  if (typeof exp !== 'number') return null;
  return exp - Math.floor(Date.now() / 1000);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    const parsed: unknown = JSON.parse(json);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
