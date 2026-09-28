import type { EmploymentStatus } from '@/features/employees/types';

/**
 * The Employee Departure Form — mirrors the live API (`/hr/departures`).
 *
 * Nearly every field is nullable: the record is created empty when an employee
 * is cancelled and filled by three parties over days or weeks. `stage`,
 * `nextStep` and `warnings` are derived by the server on every read and never
 * stored.
 */

/** The six boxes on the form. There is no "Others" box, so no free text. */
export const REASONS_FOR_LEAVING = [
  'RESIGNATION',
  'TERMINATION',
  'PROJECT_COMPLETION',
  'MARRIAGE',
  'VISA_NON_RENEWAL',
  'BEREAVEMENT',
] as const;
export type ReasonForLeaving = (typeof REASONS_FOR_LEAVING)[number];

/** Labelled as printed on the paper form. */
export const REASON_LABELS: Record<ReasonForLeaving, string> = {
  RESIGNATION: 'Resignation',
  TERMINATION: 'Termination',
  PROJECT_COMPLETION: 'Project Completion',
  MARRIAGE: 'Marriage',
  VISA_NON_RENEWAL: 'Visa Non-Renewal',
  BEREAVEMENT: 'Bereavement',
};

/** In workflow order — derived by the server, never stored. */
export const DEPARTURE_STAGES = [
  'DRAFT',
  'AWAITING_CLEARANCE',
  'CLEARANCE_SUBMITTED',
  'CLEARANCE_REJECTED',
  'AWAITING_APPROVAL',
  'COMPLETED',
  'VOIDED',
] as const;
export type DepartureStage = (typeof DEPARTURE_STAGES)[number];

export const STAGE_LABELS: Record<DepartureStage, string> = {
  DRAFT: 'Draft',
  AWAITING_CLEARANCE: 'Awaiting clearance',
  CLEARANCE_SUBMITTED: 'Clearance submitted',
  CLEARANCE_REJECTED: 'Clearance sent back',
  AWAITING_APPROVAL: 'Awaiting approval',
  COMPLETED: 'Completed',
  VOIDED: 'Voided',
};

/** The only stages in which the clearance section can be saved or submitted. */
export const CLEARANCE_EDITABLE_STAGES: readonly DepartureStage[] = [
  'AWAITING_CLEARANCE',
  'CLEARANCE_REJECTED',
];

/** Columns the API will sort by. Anything else is rejected. */
export const DEPARTURE_SORT_FIELDS = ['createdAt', 'formDate', 'departureDate', 'referenceNo'] as const;
export type DepartureSortField = (typeof DEPARTURE_SORT_FIELDS)[number];

export interface Actor {
  id: string;
  fullName: string;
}

/** The employee-side boxes on the form, read through the relation — never editable here. */
export interface DepartureEmployee {
  id: string;
  employeeCode: string;
  /** The labour file number — null until the visa has been processed. */
  fileNo: string | null;
  name: string;
  joiningDate: string;
  /** Joined from shared reference data; "Designation" on the paper form. */
  trade: { id: string; name: string } | null;
  emiratesIdNumber: string;
  visaExpiryDate: string;
  employmentStatus: EmploymentStatus;
}

/** Section 1 — "To be completed by Employee / HR". PATCH /hr/departures/:id */
export interface HrSectionPayload {
  siteProject: string | null;
  location: string | null;
  visaCancelDate: string | null;
  mustLeaveBy: string | null;
  uaeContactNo: string | null;
  homeContactNo: string | null;
  emailId: string | null;
  reason: ReasonForLeaving | null;
  passportReceived: boolean | null;
  airTicketIssued: boolean | null;
  flightNumber: string | null;
  airlineName: string | null;
  departureDate: string | null;
  departureTime: string | null;
  departureAirport: string | null;
  destinationAirport: string | null;
  employeeSignedDate: string | null;
}

/**
 * Section 2 — "To be completed by Drop off Driver / Operations Staff".
 * PATCH /hr/departures/:id/clearance. Transcribed from the signed paper form by
 * Operations staff below the Operations Manager: every date and time is what
 * the driver wrote.
 *
 * The form's Reporting Manager row is not here — it is the Operations
 * Manager's approval (POST …/clearance/approve).
 */
export interface ClearancePayload {
  immigrationCleared: boolean | null;
  immigrationClearedDate: string | null;
  immigrationClearedTime: string | null;
  securityCleared: boolean | null;
  securityClearedDate: string | null;
  securityClearedTime: string | null;
  parkingTicketNo: string | null;
  parkingTimeIn: string | null;
  parkingTimeOut: string | null;
  driverName: string | null;
  driverSignedDate: string | null;
  driverSignedTime: string | null;
  remarks: string | null;
}

export interface Departure extends HrSectionPayload, ClearancePayload {
  id: string;
  employeeId: string;
  referenceNo: string;
  formDate: string;
  /** Uploads are deferred this sprint; always null. */
  signedFormUrl: string | null;

  /** Clearance maker/checker: submitted by Operations staff, reviewed by the Operations Manager. */
  clearanceSubmittedAt: string | null;
  clearanceSubmittedBy: Actor | null;
  clearanceApprovedAt: string | null;
  clearanceApprovedBy: Actor | null;
  /** Kept only until the next submit, which clears all three. */
  clearanceRejectedAt: string | null;
  clearanceRejectedBy: Actor | null;
  clearanceRejectionNote: string | null;

  hrApprovedAt: string | null;
  hrApprovedBy: Actor | null;
  mdApprovedAt: string | null;
  mdApprovedBy: Actor | null;

  voidedAt: string | null;
  createdAt: string;
  updatedAt: string;

  employee: DepartureEmployee;

  // Derived on read.
  stage: DepartureStage;
  nextStep: string;
  warnings: string[];
  hrSectionComplete: boolean;
  /** Every field a submit needs is filled. */
  clearanceComplete: boolean;
  /** The fields still empty — named so the panel can say what is missing before submitting. */
  clearanceMissingFields: (keyof ClearancePayload)[];
}

export interface ApprovalTick {
  at: string;
  by: string | null;
}

/** One row of the Cancelled employees tab. */
export interface DepartureListItem {
  id: string;
  referenceNo: string;
  formDate: string;
  reason: ReasonForLeaving | null;
  departureDate: string | null;
  stage: DepartureStage;
  voidedAt: string | null;
  employee: Pick<DepartureEmployee, 'id' | 'employeeCode' | 'fileNo' | 'name' | 'trade'>;
  approvals: { hr: ApprovalTick | null; md: ApprovalTick | null };
}

/** GET /hr/departures query params, exactly as the API declares them. */
export interface DepartureListParams {
  page?: number;
  limit?: number;
  search?: string;
  reason?: ReasonForLeaving;
  /** Without a stage, VOIDED records are left out. */
  stage?: DepartureStage;
  departureFrom?: string;
  departureTo?: string;
  employeeId?: string;
  sortBy?: DepartureSortField;
  sortOrder?: 'asc' | 'desc';
}
