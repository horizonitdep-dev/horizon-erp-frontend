import { EM_DASH, formatDate } from '@/lib/format';

/**
 * Formatting this module needs on top of `lib/format`. Pure functions, kept
 * here rather than inline in a component so the same rule is applied wherever
 * it appears.
 */

/** `2026-09-17` — what the API wants for a date-only field. */
export function toIsoDate(value: Date): string {
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()))
    .toISOString()
    .slice(0, 10);
}

export function today(): string {
  return toIsoDate(new Date());
}

export function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toIsoDate(date);
}

/**
 * How long a placement has run — `3 months`, `18 days`. Read on the timeline
 * to answer "how long has he been sitting idle", which is the question the
 * page exists for.
 */
export function duration(startDate: string, endDate: string | null): string {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return EM_DASH;

  const days = Math.max(0, Math.round((+end - +start) / 86_400_000));

  if (days < 31) return days === 1 ? '1 day' : `${days} days`;

  const months = Math.round(days / 30.44);
  if (months < 12) return months === 1 ? '1 month' : `${months} months`;

  const years = Math.floor(months / 12);
  const remainder = months % 12;

  return remainder === 0
    ? `${years} year${years === 1 ? '' : 's'}`
    : `${years}y ${remainder}m`;
}

/** `14 Aug 2026 — present` for an open placement. */
export function placementDates(startDate: string, endDate: string | null): string {
  return endDate ? `${formatDate(startDate)} — ${formatDate(endDate)}` : formatDate(startDate);
}

/**
 * A matrix cell. Zero renders BLANK, as the sheet does — a grid of zeros is
 * unreadable, and blanks make the occupied cells jump out.
 */
export function cell(count: number): string {
  return count === 0 ? '' : String(count);
}

/** Groups movements by day, because "what moved today" is how the log is read. */
export function groupByDate<T extends { date: string }>(rows: T[]): { date: string; rows: T[] }[] {
  const byDate = new Map<string, T[]>();

  for (const row of rows) {
    const key = row.date.slice(0, 10);
    byDate.set(key, [...(byDate.get(key) ?? []), row]);
  }

  return [...byDate.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, grouped]) => ({ date, rows: grouped }));
}
