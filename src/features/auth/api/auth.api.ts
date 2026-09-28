import { api } from '@/core/api/client';
import { unwrap, type ApiEnvelope } from '@/core/api/unwrap';
import type { AuthUser, ChangePasswordPayload, LoginPayload, LoginResponse } from '../types';

/** Endpoint calls only. No React, no state, no error handling beyond the envelope. */

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await api.post<ApiEnvelope<LoginResponse>>('/auth/login', payload);
  return unwrap(res);
}

export async function logout(): Promise<void> {
  await api.post<ApiEnvelope<null>>('/auth/logout');
}

/**
 * Revokes the user's other sessions and returns a fresh token pair, with
 * mustChangePassword cleared on the returned user.
 */
export async function changePassword(payload: ChangePasswordPayload): Promise<LoginResponse> {
  const res = await api.patch<ApiEnvelope<LoginResponse>>('/auth/change-password', payload);
  return unwrap(res);
}

export async function me(): Promise<AuthUser> {
  const res = await api.get<ApiEnvelope<AuthUser>>('/auth/me');
  return unwrap(res);
}
