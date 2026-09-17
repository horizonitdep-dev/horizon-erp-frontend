import { AxiosError, type AxiosResponse } from 'axios';

/**
 * The NestJS response envelope (guide §4). Every response unwraps here and
 * nowhere else — no inline `res.data.data` anywhere in the app.
 */
export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

/** Validation failures carry a per-field breakdown alongside the message. */
export interface ApiFieldError {
  field?: string;
  message: string;
}

interface ErrorEnvelope {
  message?: string;
  errors?: ApiFieldError[];
}

/**
 * Paginated collections. Confirmed against GET /users, which is the only
 * paginated endpoint the API currently exposes.
 */
export interface Paginated<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function unwrap<T>(res: AxiosResponse<ApiEnvelope<T>>): T {
  return res.data.data;
}

/**
 * The envelope's `message` for a failed request, which is what the UI shows —
 * a 409 on a duplicate employee code, a rejected login, a validation failure.
 * Falls back to something honest rather than "Something went wrong".
 */
export function apiMessage(error: unknown, fallback = 'Something went wrong. Try again.'): string {
  if (error instanceof AxiosError) {
    if (isNetworkError(error)) {
      return 'Cannot reach the server. Check your connection and try again.';
    }
    const envelope = error.response?.data as ErrorEnvelope | undefined;

    // A validation failure's own `message` is just "Validation failed", which
    // tells the user nothing. The per-field detail is the useful part.
    const detail = fieldErrors(error)
      .map((e) => e.message)
      .filter(Boolean);
    if (detail.length) return detail.join('. ');

    if (typeof envelope?.message === 'string' && envelope.message) return envelope.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/**
 * The per-field validation errors, for mapping onto form inputs.
 * Field names match the DTO property names.
 */
export function fieldErrors(error: unknown): ApiFieldError[] {
  if (!(error instanceof AxiosError)) return [];
  const envelope = error.response?.data as ErrorEnvelope | undefined;
  return Array.isArray(envelope?.errors) ? envelope.errors : [];
}

/**
 * No response arrived at all — offline, DNS failure, timeout, CORS.
 * Never an auth failure, so it must never log anyone out (guide §5).
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof AxiosError && !error.response;
}

export function statusOf(error: unknown): number | null {
  return error instanceof AxiosError ? (error.response?.status ?? null) : null;
}
