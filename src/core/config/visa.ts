import { env } from './env';

/**
 * Visa document thresholds.
 *
 * ⚠️ CONFIRM 6 (guide §4 / §8) — the mockup shows red for a date roughly 30
 * days out and amber for roughly 90. These are configuration, never hardcoded
 * in a component, so a backend answer changes one env value and nothing else.
 *
 * The design's five status values are not one field. `Deployed`, `On bench`
 * and `On leave` are a stored deployment state; `Renewal due` and `Expiring`
 * are derived from visaExpiry against today. We compute the visa state on read
 * and let it win in the table when the document is inside its warning window —
 * the split model confirmed for this sprint.
 */

export const VISA_URGENT_DAYS = env.visaUrgentDays;
export const VISA_WARNING_DAYS = env.visaWarningDays;

/** `urgent` maps to `.expiry--b`, `warning` to `.expiry--w`, `ok` to plain. */
export type VisaState = 'expired' | 'urgent' | 'warning' | 'ok' | 'unknown';

const MS_PER_DAY = 86_400_000;

/** Whole days from today until `isoDate`. Negative once the date has passed. */
export function daysUntil(isoDate: string | null | undefined, now: Date = new Date()): number | null {
  if (!isoDate) return null;
  const target = new Date(isoDate);
  if (Number.isNaN(target.getTime())) return null;
  // Compare calendar days, not instants — otherwise a date "expires" at a time
  // of day rather than at midnight.
  const startOfToday = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((startOfTarget - startOfToday) / MS_PER_DAY);
}

export function visaState(isoDate: string | null | undefined, now: Date = new Date()): VisaState {
  const days = daysUntil(isoDate, now);
  if (days === null) return 'unknown';
  if (days < 0) return 'expired';
  if (days <= VISA_URGENT_DAYS) return 'urgent';
  if (days <= VISA_WARNING_DAYS) return 'warning';
  return 'ok';
}

/** The `.expiry` modifier for a visa state, or '' when the date is not notable. */
export function expiryClass(state: VisaState): string {
  if (state === 'expired' || state === 'urgent') return 'expiry--b';
  if (state === 'warning') return 'expiry--w';
  return '';
}
