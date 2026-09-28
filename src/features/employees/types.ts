/**
 * ✅ Mirrors the live API (HIRS API 1.0, `/api/docs-json`) — CreateEmployeeDto,
 * UpdateEmployeeDto and the GET /hr/employees query params.
 *
 * This replaced an earlier guess based on the HR mockup. The real model differs
 * in ways that matter:
 *   - one `name`, not firstName / lastName
 *   - the trade is a relation (`trade`), picked from shared reference data,
 *     replacing what used to be a free-text `designation`
 *   - `department`, not `camp`
 *   - visa, Emirates ID and passport are dated DOCUMENTS with history, not
 *     flat columns — a renewal adds a row rather than overwriting one
 *   - no `deploymentStatus` and no `deployedTo` at all. Instead the server
 *     stores `employmentStatus` (ACTIVE | CANCELLED) and derives `visaStatus`.
 */

export const VISA_TYPES = ['EMPLOYMENT', 'VISIT', 'TRANSFERABLE', 'DEPENDENT', 'OTHER'] as const;
export type VisaType = (typeof VISA_TYPES)[number];

export const GENDERS = ['MALE', 'FEMALE'] as const;
export type Gender = (typeof GENDERS)[number];

export const MARITAL_STATUSES = ['SINGLE', 'MARRIED', 'OTHER'] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

export const DRIVING_LICENSE = ['YES', 'NO', 'OTHER'] as const;
export type DrivingLicense = (typeof DRIVING_LICENSE)[number];

export const FAMILY_ROLES = ['SPOUSE', 'CHILDREN', 'HOME_FAMILY', 'UAE_RELATIVE'] as const;
export type FamilyRole = (typeof FAMILY_ROLES)[number];

export const EMPLOYMENT_STATUSES = ['ACTIVE', 'CANCELLED'] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

/** Derived by the server from the current documents — not a stored field. */
export const VISA_STATUSES = ['VALID', 'RENEWAL_DUE', 'EXPIRING', 'EXPIRED'] as const;
export type VisaStatus = (typeof VISA_STATUSES)[number];

/** Columns the API will sort by. Anything else is rejected. */
/**
 * Visa expiry is gone from here: it lives on the current VISA document now, and
 * ordering by a to-many relation's column is not something the API can do. The
 * visa-status FILTER still works, which is what the column was mostly used for.
 */
export const SORTABLE_FIELDS = ['name', 'employeeCode', 'joiningDate'] as const;
export type SortableField = (typeof SORTABLE_FIELDS)[number];

export const VISA_STATUS_LABELS: Record<VisaStatus, string> = {
  VALID: 'Valid',
  RENEWAL_DUE: 'Renewal due',
  EXPIRING: 'Expiring',
  EXPIRED: 'Expired',
};

export const VISA_TYPE_LABELS: Record<VisaType, string> = {
  EMPLOYMENT: 'Employment',
  VISIT: 'Visit',
  TRANSFERABLE: 'Transferable',
  DEPENDENT: 'Dependent',
  OTHER: 'Other',
};

export const FAMILY_ROLE_LABELS: Record<FamilyRole, string> = {
  SPOUSE: 'Spouse',
  CHILDREN: 'Children',
  HOME_FAMILY: 'Family at home',
  UAE_RELATIVE: 'Relative in the UAE',
};

export interface FamilyContact {
  role: FamilyRole;
  name?: string | null;
  location?: string | null;
  contactNo?: string | null;
}

export interface EmergencyContact {
  name: string;
  address: string;
  relation: string;
  contactNo: string;
}

/** Which dated document this is. The labour card belongs to the PR module. */
export const DOCUMENT_KINDS = ['VISA', 'EMIRATES_ID', 'PASSPORT', 'LABOUR_CARD'] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

/** The three HR records. A labour card is the PRO’s, so HR is never asked for one. */
export const HR_DOCUMENT_KINDS = ['VISA', 'EMIRATES_ID', 'PASSPORT'] as const;

export const DOCUMENT_LABELS: Record<DocumentKind, string> = {
  VISA: 'Visa',
  EMIRATES_ID: 'Emirates ID',
  PASSPORT: 'Passport',
  LABOUR_CARD: 'Labour card',
};

/**
 * One issue of one document. A renewal is a NEW row — it never overwrites the
 * one it replaced, which is what the flat columns used to do.
 */
export interface EmployeeDocumentPayload {
  kind: DocumentKind;
  /** Required for an Emirates ID or passport; a visa need not carry one. */
  number?: string | null;
  issuedAt: string;
  expiresAt: string;
  /** kind = VISA only. */
  visaType?: VisaType | null;
  visaTypeOther?: string | null;
  /** kind = PASSPORT only. */
  issuingCountry?: string | null;
  remark?: string | null;
}

export interface EmployeeDocument extends EmployeeDocumentPayload {
  id: string;
  /** Null means this is the one he holds now. Set when a renewal replaces it. */
  supersededAt: string | null;
  createdAt: string;
  createdBy?: { id: string; fullName: string } | null;
}

/** A kind with the document he holds and the renewals it replaced, newest first. */
export interface DocumentGroup {
  kind: DocumentKind;
  label: string;
  current: EmployeeDocument | null;
  history: EmployeeDocument[];
}

/** The create payload, field for field with CreateEmployeeDto. */
export interface EmployeePayload {
  /** Optional: the labour file number only exists once the visa is processed. */
  fileNo?: string;
  name: string;
  tradeId: string;
  department: string;
  reportingManager: string;
  joiningDate: string;
  contractStart: string;
  contractEnd: string;
  /** At least a passport and a visa, since the paper form asks for both. */
  documents: EmployeeDocumentPayload[];
  dateOfBirth: string;
  nationality: string;
  religion: string;
  email: string;
  telNo: string;
  mobileNo: string;
  presentAddress: string;
  permanentAddress: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  maritalStatusOther?: string | null;
  numberOfChildren?: number | null;
  drivingLicense: DrivingLicense;
  drivingLicenseOther?: string | null;
  drivingLicenseValidUntil?: string | null;
  photoUrl?: string | null;
  familyContacts?: FamilyContact[];
  emergencyContacts: EmergencyContact[];
}

/**
 * The record as returned. `employmentStatus` and `visaStatus` are server-owned;
 * `visaStatus` is optional because the response schema is not documented in the
 * OpenAPI spec — where it is absent the UI derives it from the current visa's `expiresAt`.
 */
export interface Employee extends EmployeePayload {
  id: string;
  /** Issued by the server on save — returned, never submitted. */
  employeeCode: string;
  /** The trade joined from shared reference data; `tradeId` is what is written. */
  trade: { id: string; name: string; category?: string } | null;
  /** Current documents on the list; every one, plus history, on the record. */
  documents: EmployeeDocument[];
  /** Grouped for display — only on GET /hr/employees/:id. */
  documentGroups?: DocumentGroup[];
  employmentStatus: EmploymentStatus;
  visaStatus?: VisaStatus;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Query params for GET /hr/employees, exactly as the API declares them. */
export interface EmployeeListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: SortableField;
  sortOrder?: 'asc' | 'desc';
  tradeId?: string;
  nationality?: string;
  department?: string;
  /** Defaults to ACTIVE server-side. */
  employmentStatus?: EmploymentStatus;
  visaStatus?: VisaStatus;
}

/** GET /hr/employees/stats — shape confirmed against the live endpoint. */
export interface EmployeeStats {
  totalActive: number | null;
  documentsExpiring: number | null;
  onLeave: number | null;
  joiningThisMonth: number | null;
  currentEmployees: number | null;
  cancelledEmployees: number | null;
  horizonDocs: number | null;
  letterReference: number | null;
}

/** GET /hr/employees/options — the lookup lists behind the filters and form. */
/** Designations are NOT here — they come from GET /operations/trades. */
export interface EmployeeOptions {
  departments: string[];
  nationalities: string[];
  countries: string[];
  religions: string[];
}
