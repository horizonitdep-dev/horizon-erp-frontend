'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/core/config/query-keys';
import { getDashboardSummary } from '../api/dashboard.api';
import type { DashboardRange, DashboardSummary } from '../types';

export function useDashboard(range: DashboardRange) {
  return useQuery<DashboardSummary>({
    queryKey: queryKeys.dashboard.summary(range),
    queryFn: () => getDashboardSummary(range),
  });
}
