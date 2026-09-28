'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/core/api/client';
import { unwrap, type ApiEnvelope } from '@/core/api/unwrap';
import { queryKeys } from '@/core/config/query-keys';

/**
 * Trades — shared reference data, which is why this lives in core/ rather than
 * inside either feature. HR picks a designation from this list; Operations
 * groups the daily report by it. Neither owns the other's data.
 */

export type TradeCategory = 'SITE' | 'MARKUP' | 'OFFICE';

export interface Trade {
  id: string;
  name: string;
  category: TradeCategory;
  sortOrder: number;
  isActive: boolean;
}

export const TRADE_CATEGORY_LABELS: Record<TradeCategory, string> = {
  SITE: 'Site trades',
  MARKUP: 'Markup trades',
  OFFICE: 'Office titles',
};

async function fetchTrades(category?: TradeCategory): Promise<Trade[]> {
  const res = await api.get<ApiEnvelope<Trade[]>>('/operations/trades', {
    params: category ? { category } : undefined,
  });
  return unwrap(res);
}

/** Rarely changes, so it is cached for the session rather than refetched. */
export function useTrades(category?: TradeCategory) {
  return useQuery({
    queryKey: queryKeys.trades.list(category),
    queryFn: () => fetchTrades(category),
    staleTime: 30 * 60 * 1000,
  });
}

/** Trades grouped by category, for a `<select>` with `<optgroup>`s. */
export function useGroupedTrades() {
  const query = useTrades();

  const groups = (['SITE', 'MARKUP', 'OFFICE'] as const)
    .map((category) => ({
      category,
      label: TRADE_CATEGORY_LABELS[category],
      trades: (query.data ?? []).filter((trade) => trade.category === category),
    }))
    .filter((group) => group.trades.length > 0);

  return { ...query, groups };
}
