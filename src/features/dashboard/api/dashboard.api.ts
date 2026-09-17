import { api } from '@/core/api/client';
import { unwrap, type ApiEnvelope } from '@/core/api/unwrap';
import type { DashboardRange, DashboardSummary } from '../types';

/**
 * ⚠️ GET /dashboard/summary is not implemented on the backend yet. The call is
 * written to the contract in guide §4 so the screens work the moment it lands;
 * until then it 404s and every panel shows its error state.
 */
export async function getDashboardSummary(range: DashboardRange): Promise<DashboardSummary> {
  const res = await api.get<ApiEnvelope<DashboardSummary>>('/dashboard/summary', {
    params: { range },
  });
  return unwrap(res);
}
