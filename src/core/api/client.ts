import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { env } from '@/core/config/env';
import { clearTokens, getAccessToken } from '@/core/auth/token-store';
import { refreshAccessToken } from '@/core/auth/refresh';

/**
 * The one axios instance. Components never touch it — they call a hook, the
 * hook calls its feature's api/ module, and that module uses this.
 */
export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

/** Requests that must never trigger a refresh-and-replay. */
const AUTH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

/**
 * 401 → refresh → replay the original request, exactly once (guide §5).
 *
 * Only a failed /auth/refresh ends the session. A 401 from any other endpoint
 * gets one retry; a network error or a 5xx never logs anyone out.
 */
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!(error instanceof AxiosError)) throw error;

    const status = error.response?.status;
    const original = error.config as RetriableConfig | undefined;

    // No response at all — offline, timeout, CORS. Not an auth failure.
    if (!error.response || !original) throw error;

    if (status !== 401) throw error;

    const url = original.url ?? '';
    if (AUTH_PATHS.some((path) => url.includes(path))) {
      // Bad credentials, or a refresh the server refused. Nothing to retry.
      throw error;
    }

    if (original._retried) {
      endSession();
      throw error;
    }

    original._retried = true;

    try {
      const token = await refreshAccessToken();
      original.headers.set('Authorization', `Bearer ${token}`);
      return await api.request(original);
    } catch (refreshError) {
      // The refresh itself failed. If it failed because the server refused it,
      // the session is genuinely over. If it failed because the network is
      // down, refresh.ts left the tokens in place and we surface the original
      // error without logging anyone out.
      if (refreshError instanceof AxiosError && !refreshError.response) {
        throw error;
      }
      endSession();
      throw error;
    }
  },
);

/* ── session-ended notification ───────────────────────────────────────────
   core/ cannot import a feature or a router, so it announces instead. The
   auth provider subscribes and does the redirect. */

type SessionEndedListener = () => void;
const listeners = new Set<SessionEndedListener>();

export function onSessionEnded(listener: SessionEndedListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Clear tokens and tell the app. Idempotent — safe to call from several places. */
export function endSession(): void {
  clearTokens();
  listeners.forEach((listener) => listener());
}

/** Typed helper so feature api/ modules stay one-liners. */
export type RequestConfig = AxiosRequestConfig;
