import { visaState } from '@/core/config/visa';
import { EM_DASH, formatDate } from '@/lib/format';
import { VISA_STATUS_LABELS, type Employee, type VisaStatus } from '../types';

/**
 * The server derives `visaStatus` from `visaExpiryDate` and exposes the same
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

export function resolveVisaStatus(employee: Pick<Employee, 'visaStatus' | 'visaExpiryDate'>): VisaStatus | null {
  if (employee.visaStatus) return employee.visaStatus;
  switch (visaState(employee.visaExpiryDate)) {
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
export function VisaExpiry({ employee }: { employee: Pick<Employee, 'visaStatus' | 'visaExpiryDate'> }) {
  if (!employee.visaExpiryDate) return <span className="expiry">{EM_DASH}</span>;

  const status = resolveVisaStatus(employee);
  const modifier =
    status === 'EXPIRED' || status === 'RENEWAL_DUE'
      ? 'expiry--b'
      : status === 'EXPIRING'
        ? 'expiry--w'
        : '';

  return <span className={`expiry ${modifier}`.trim()}>{formatDate(employee.visaExpiryDate)}</span>;
}
