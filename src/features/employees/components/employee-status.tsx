import { visaState } from '@/core/config/visa';
import { EM_DASH, formatDate } from '@/lib/format';
import { currentVisa } from '../lib/documents';
import { VISA_STATUS_LABELS, type Employee, type VisaStatus } from '../types';

/**
 * The server derives `visaStatus` from the current visa's expiry and exposes
 * the same
 * four buckets as a filter, so it is the authority. The response schema is not
 * documented in the OpenAPI spec, so where the field is absent this falls back
 * to the local thresholds in core/config/visa.ts — which produce the same
 * buckets from the same date.
 */

const VISA_DOT: Record<VisaStatus, string> = {
  VALID: 'good',
  RENEWAL_DUE: 'bad',
  EXPIRING: 'warn',
  EXPIRED: 'bad',
};

/** What these need: the server's verdict if it gave one, else the visa itself. */
type WithVisa = Pick<Employee, 'visaStatus' | 'documents'>;

/** The expiry of the visa he HOLDS. A renewed one is history, not his status. */
function visaExpiry(employee: WithVisa): string | null {
  return currentVisa(employee.documents)?.expiresAt ?? null;
}

export function resolveVisaStatus(employee: WithVisa): VisaStatus | null {
  if (employee.visaStatus) return employee.visaStatus;
  switch (visaState(visaExpiry(employee))) {
    case 'expired':
      return 'EXPIRED';
    case 'urgent':
      return 'RENEWAL_DUE';
    case 'warning':
      return 'EXPIRING';
    case 'ok':
      return 'VALID';
    default:
      return null;
  }
}

export function EmployeeStatus({ employee }: { employee: Employee }) {
  // A cancelled record is cancelled, whatever its documents say.
  if (employee.employmentStatus === 'CANCELLED') {
    return (
      <span className="status">
        <i className="dot dot--neutral" />
        Cancelled
      </span>
    );
  }

  const status = resolveVisaStatus(employee);
  if (!status) return <span className="status">{EM_DASH}</span>;

  return (
    <span className="status">
      <i className={`dot dot--${VISA_DOT[status]}`} />
      {VISA_STATUS_LABELS[status]}
    </span>
  );
}

/** Visa expiry date, coloured by how close it is. */
export function VisaExpiry({ employee }: { employee: WithVisa }) {
  const expiresAt = visaExpiry(employee);

  if (!expiresAt) return <span className="expiry">{EM_DASH}</span>;

  const status = resolveVisaStatus(employee);
  const modifier =
    status === 'EXPIRED' || status === 'RENEWAL_DUE'
      ? 'expiry--b'
      : status === 'EXPIRING'
        ? 'expiry--w'
        : '';

  return <span className={`expiry ${modifier}`.trim()}>{formatDate(expiresAt)}</span>;
}
