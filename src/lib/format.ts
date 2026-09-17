/**
 * Display formatting. DESIGN.md §12: dates are `14 Aug 2026`, currency is
 * `AED 3.8M` / `AED 640k` in summaries and full digits in tables.
 *
 * Every one of these renders an em dash for missing data rather than a zero or
 * an empty cell — a KPI with no data shows `—`, not `0` (guide §6.3).
 */

export const EM_DASH = '—';

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** `14 Aug 2026`. Returns `—` for null, undefined or an unparseable date. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return EM_DASH;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return EM_DASH;
  return DATE_FORMAT.format(date);
}

/** Thousands-separated integer, or `—`. */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EM_DASH;
  return value.toLocaleString('en-GB');
}

/** `AED 3.8M`, `AED 640k`, `AED 940`. Summary form — tables use full digits. */
export function formatCurrencyShort(value: number | null | undefined, currency = 'AED'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EM_DASH;
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${currency} ${trimZero(value / 1_000_000)}M`;
  if (abs >= 1_000) return `${currency} ${trimZero(value / 1_000)}k`;
  return `${currency} ${value.toLocaleString('en-GB')}`;
}

/** `AED 3,840,000`. Full digits, for table cells. */
export function formatCurrency(value: number | null | undefined, currency = 'AED'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EM_DASH;
  return `${currency} ${value.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
}

function trimZero(n: number): string {
  const rounded = n.toFixed(1);
  return rounded.endsWith('.0') ? rounded.slice(0, -2) : rounded;
}

/**
 * Initials for the table chip and top-bar avatar — `HA` from `Hamed Al Mansouri`.
 * The API has no split name field, so this takes the first and last word of a
 * full name rather than separate first/last properties.
 */
export function initials(fullName?: string | null): string {
  const words = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length === 0) return '??';
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

/** The name to greet someone by — `Hamed` from `Hamed Al Mansouri`. */
export function firstName(fullName?: string | null): string {
  return fullName?.trim().split(/\s+/)[0] ?? '';
}

/** `Good morning` / `Good afternoon` / `Good evening` — hub headline, guide §6.2. */
export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
