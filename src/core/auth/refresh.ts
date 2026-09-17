import axios from 'axios';
import { env } from '@/core/config/env';
import { unwrap, type ApiEnvelope } from '@/core/api/unwrap';
import { clearTokens, getRefreshToken, setTokens } from './token-store';

/**
 * Single-flight refresh — guide §5, failure mode 2.
 *
 * A page firing six parallel requests gets six 401s. Without this, all six call
 * /auth/refresh; with rotation on, the first succeeds and invalidates the token
 * the other five are holding, and one of their failures logs the user out.
 * Here every caller awaits the same promise, so exactly one call is ever made.
 */

let inFlight: Promise<string> | null = null;

/**
 * A bare client with no interceptors. The refresh call must never go through
 * the interceptor that triggers refreshes, or a failed refresh recurses.
 */
const refreshClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

/** Thrown when the refresh token is gone or the server rejected it. */
export class RefreshFailedError extends Error {
  constructor(message = 'Session expired') {
    super(message);
    this.name = 'RefreshFailedError';
  }
}

export function refreshAccessToken(): Promise<string> {
  if (inFlight) return inFlight;
  inFlight = doRefresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** True while a refresh is running — lets the boot sequence avoid a second one. */
export function isRefreshing(): boolean {
  return inFlight !== null;
}

type RefreshResponse = {
  accessToken: string;
  /**
   * ⚠️ CONFIRM 3 (guide §4) — present if /auth/refresh rotates. Persisted the
   * instant it arrives; absent means the existing refresh token stays valid.
   */
  refreshToken?: string | null;
};

async function doRefresh(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new RefreshFailedError('No refresh token');
  }

  try {
    const res = await refreshClient.post<ApiEnvelope<RefreshResponse>>('/auth/refresh', {
      refreshToken,
    });
    const data = unwrap(res);
    if (!data?.accessToken) {
      throw new RefreshFailedError('Refresh returned no access token');
    }
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return data.accessToken;
  } catch (error) {
    // Only a *refused* refresh ends the session. A 5xx means the server is
    // unwell, not that the token is bad — clearing here would turn a backend
    // restart into a forced logout, which is the exact failure guide §5 exists
    // to prevent. Network errors leave the tokens alone for the same reason.
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (status === 401 || status === 403) {
      clearTokens();
    }
    throw error instanceof RefreshFailedError
      ? error
      : new RefreshFailedError('Could not refresh the session');
  }
}
