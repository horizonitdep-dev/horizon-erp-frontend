import { api } from '@/core/api/client';
import { unwrap, type ApiEnvelope } from '@/core/api/unwrap';
import type { AuthUser, LoginPayload, LoginResponse } from '../types';

/** Endpoint calls only. No React, no state, no error handling beyond the envelope. */

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await api.post<ApiEnvelope<LoginResponse>>('/auth/login', payload);
  return unwrap(res);
}

export async function logout(): Promise<void> {
  await api.post<ApiEnvelope<null>>('/auth/logout');
}

export async function me(): Promise<AuthUser> {
  const res = await api.get<ApiEnvelope<AuthUser>>('/auth/me');
  return unwrap(res);
}
