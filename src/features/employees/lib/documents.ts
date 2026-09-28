import { EM_DASH, formatDate } from '@/lib/format';
import {
  DOCUMENT_LABELS,
  type DocumentKind,
  type EmployeeDocument,
  type VisaType,
} from '../types';

/**
 * Reading a person's documents. Pure functions, mirroring the backend's
 * `employee-documents.ts` — current and expired are both derived, never flagged.
 *
 * A renewal adds a row and closes the one it replaced, so `supersededAt` is the
 * only thing that says which is in force.
 */

export function isCurrent(document: Pick<EmployeeDocument, 'supersededAt'>): boolean {
  return !document.supersededAt;
}

/** The document of that kind he holds now, or null if he has none. */
export function currentOfKind(
  documents: readonly EmployeeDocument[] | undefined,
  kind: DocumentKind,
): EmployeeDocument | null {
  return documents?.find((d) => d.kind === kind && isCurrent(d)) ?? null;
}

/** The visa he holds now — what used to be `Employee.visaType`. */
export function currentVisa(
  documents: readonly EmployeeDocument[] | undefined,
): EmployeeDocument | null {
  return currentOfKind(documents, 'VISA');
}

export function currentVisaType(
  documents: readonly EmployeeDocument[] | undefined,
): VisaType | null {
  return currentVisa(documents)?.visaType ?? null;
}

/** The renewals a document has been through, newest first. */
export function historyOfKind(
  documents: readonly EmployeeDocument[] | undefined,
  kind: DocumentKind,
): EmployeeDocument[] {
  return (documents ?? [])
    .filter((d) => d.kind === kind && !isCurrent(d))
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

/**
 * One line naming a document, for a read-only row: the number where there is
 * one, then the expiry. An employment visa has no number on the paper form, so
 * it reads as its type instead.
 */
export function describeDocument(document: EmployeeDocument | null): string {
  if (!document) return EM_DASH;

  const name = document.number ?? (document.visaType ? visaLabel(document.visaType) : null);

  return name
    ? `${name} · expires ${formatDate(document.expiresAt)}`
    : `Expires ${formatDate(document.expiresAt)}`;
}

export function documentLabel(kind: DocumentKind): string {
  return DOCUMENT_LABELS[kind];
}

const VISA_LABELS: Record<VisaType, string> = {
  EMPLOYMENT: 'Employment',
  VISIT: 'Visit',
  TRANSFERABLE: 'Transferable',
  DEPENDENT: 'Dependent',
  OTHER: 'Other',
};

export function visaLabel(visaType: VisaType): string {
  return VISA_LABELS[visaType];
}

/**
 * The visa types that mean "employed here", and so must carry an Emirates ID.
 * Visit, Dependent and Other are candidates, which is exactly who HR needs to
 * record before the paperwork exists.
 */
export const EMPLOYED_VISA_TYPES: readonly VisaType[] = ['EMPLOYMENT', 'TRANSFERABLE'];

export function isEmployedVisa(visaType: VisaType | null | undefined): boolean {
  return !!visaType && EMPLOYED_VISA_TYPES.includes(visaType);
}
