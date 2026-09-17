/**
 * ✅ Mirrors the live API (HIRS API 1.0, `/api/docs-json`) — CreateEmployeeDto,
 * UpdateEmployeeDto and the GET /hr/employees query params.
 *
 * This replaced an earlier guess based on the HR mockup. The real model differs
 * in ways that matter:
 *   - one `name`, not firstName / lastName
 *   - `designation`, not `trade`
 *   - `department`, not `camp`
 *   - `visaExpiryDate`, not `visaExpiry`
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

/** Derived by the server from visaExpiryDate — not a stored field. */
export const VISA_STATUSES = ['VALID', 'RENEWAL_DUE', 'EXPIRING', 'EXPIRED'] as const;
export type VisaStatus = (typeof VISA_STATUSES)[number];

/** Columns the API will sort by. Anything else is rejected. */
export const SORTABLE_FIELDS = ['name', 'employeeCode', 'visaExpiryDate', 'joiningDate'] as const;
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

/** The create payload, field for field with CreateEmployeeDto. */
export interface EmployeePayload {
  employeeCode: string;
  name: string;
  designation: string;
  department: string;
  reportingManager: string;
  joiningDate: string;
  contractStart: string;
  contractEnd: string;
  visaType: VisaType;
  visaTypeOther?: string | null;
  visaIssueDate: string;
  visaExpiryDate: string;
  visitVisaNumber?: string | null;
  visitVisaIssueDate?: string | null;
  visitVisaExpiryDate?: string | null;
  emiratesIdNumber: string;
  emiratesIdIssueDate: string;
  emiratesIdExpiryDate: string;
  passportNumber: string;
  passportCountry: string;
  passportIssueDate: string;
  passportValidUntil: string;
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
 * OpenAPI spec — where it is absent the UI derives it from `visaExpiryDate`.
 */
export interface Employee extends EmployeePayload {
  id: string;
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
  designation?: string;
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
export interface EmployeeOptions {
  designations: string[];
  departments: string[];
  nationalities: string[];
  countries: string[];
  religions: string[];
}
