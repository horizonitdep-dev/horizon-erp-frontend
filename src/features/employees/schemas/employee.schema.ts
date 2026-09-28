import { z } from 'zod';
import {
  DRIVING_LICENSE,
  FAMILY_ROLES,
  GENDERS,
  HR_DOCUMENT_KINDS,
  MARITAL_STATUSES,
  VISA_TYPES,
} from '../types';

/**
 * Mirrors CreateEmployeeDto. Every field the API marks required is required
 * here, so a save is rejected in the browser rather than by a 400.
 *
 * The conditional "Other" fields follow the DTO's intent: the free-text
 * companion is only meaningful when its enum is set to OTHER.
 */

const required = (label: string) => z.string().trim().min(1, `${label} is required`);
const isoDate = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be a date`);
const optionalText = z.string().trim().optional();

export const emergencyContactSchema = z.object({
  name: required('Name'),
  address: required('Address'),
  relation: required('Relation'),
  contactNo: required('Contact number'),
});

export const familyContactSchema = z.object({
  role: z.enum(FAMILY_ROLES),
  name: optionalText,
  location: optionalText,
  contactNo: optionalText,
});

/**
 * One document on a new record. The rules mirror the ones the backend enforces,
 * so a save is rejected here rather than by a 400.
 *
 * A number is not asked for on an employment visa — the paper form has no box
 * for one — but an Emirates ID and a passport are nothing without theirs.
 * LABOUR_CARD is the PRO's and never offered, so the enum stops at three.
 */
export const employeeDocumentSchema = z
  .object({
    kind: z.enum(HR_DOCUMENT_KINDS),
    number: optionalText,
    visaType: z.enum(VISA_TYPES).optional(),
    visaTypeOther: optionalText,
    issuingCountry: optionalText,
    issuedAt: isoDate('Issue date'),
    expiresAt: isoDate('Expiry date'),
    remark: optionalText,
  })
  .superRefine((doc, ctx) => {
    if (doc.kind !== 'VISA' && !doc.number?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['number'],
        message: `${doc.kind === 'EMIRATES_ID' ? 'Emirates ID' : 'Passport'} number is required`,
      });
    }

    if (doc.kind === 'VISA' && !doc.visaType) {
      ctx.addIssue({ code: 'custom', path: ['visaType'], message: 'Pick the type of visa' });
    }

    if (doc.visaType === 'OTHER' && !doc.visaTypeOther?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['visaTypeOther'],
        message: 'Describe the visa type',
      });
    }

    if (doc.kind === 'PASSPORT' && !doc.issuingCountry?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['issuingCountry'],
        message: 'Issuing country is required',
      });
    }

    if (doc.issuedAt && doc.expiresAt && doc.expiresAt <= doc.issuedAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['expiresAt'],
        message: 'Expiry must be after the issue date',
      });
    }
  });

export const employeeSchema = z
  .object({
    // ── identity ──
    // employeeCode is issued by the server, never submitted.
    fileNo: z.string().trim().optional(),
    name: required('Name'),
    tradeId: required('Designation'),
    department: required('Department'),
    reportingManager: required('Reporting manager'),

    // ── contract ──
    joiningDate: isoDate('Joining date'),
    contractStart: isoDate('Contract start'),
    contractEnd: isoDate('Contract end'),

    // ── documents ──
    /** Visa, Emirates ID and passport, each with its own dates and history. */
    documents: z.array(employeeDocumentSchema).min(1, 'Record at least one document'),

    // ── personal ──
    dateOfBirth: isoDate('Date of birth'),
    nationality: required('Nationality'),
    religion: required('Religion'),
    gender: z.enum(GENDERS),
    maritalStatus: z.enum(MARITAL_STATUSES),
    maritalStatusOther: optionalText,
    // Kept as a string so the schema's input and output types stay identical.
    // A z.coerce.number() here would diverge them, and react-hook-form's
    // resolver generic then refuses the schema. Converted in toPayload().
    numberOfChildren: z.string().trim().regex(/^\d*$/, 'Use a whole number').optional(),
    drivingLicense: z.enum(DRIVING_LICENSE),
    drivingLicenseOther: optionalText,
    drivingLicenseValidUntil: optionalText,

    // ── contact ──
    email: z.string().trim().min(1, 'Email is required').email('That is not a valid email'),
    telNo: required('Telephone number'),
    mobileNo: required('Mobile number'),
    presentAddress: required('Present address'),
    permanentAddress: required('Permanent address'),

    // ── contacts ──
    familyContacts: z.array(familyContactSchema),
    /** The DTO requires the array; one usable contact is the point of it. */
    emergencyContacts: z.array(emergencyContactSchema).min(1, 'Add at least one emergency contact'),
  })
  .refine((v) => v.maritalStatus !== 'OTHER' || !!v.maritalStatusOther?.trim(), {
    path: ['maritalStatusOther'],
    message: 'Describe the marital status',
  })
  .refine((v) => v.drivingLicense !== 'OTHER' || !!v.drivingLicenseOther?.trim(), {
    path: ['drivingLicenseOther'],
    message: 'Describe the licence',
  })
  // A licence someone holds has an expiry that has to be tracked; one they do
  // not hold has nothing to expire. So the date is required only for YES.
  .refine((v) => v.drivingLicense !== 'YES' || !!v.drivingLicenseValidUntil?.trim(), {
    path: ['drivingLicenseValidUntil'],
    message: 'Enter the licence expiry date',
  })
  .refine((v) => !v.contractEnd || !v.contractStart || v.contractEnd >= v.contractStart, {
    path: ['contractEnd'],
    message: 'Contract end cannot be before it starts',
  });

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

/**
 * On create the visa must still be valid — opening a record against an already
 * expired document is a data-entry mistake. On edit it may be in the past:
 * existing records legitimately hold lapsed visas awaiting renewal, and a
 * renewal is its own action rather than a correction of this form.
 */
export const createEmployeeSchema = employeeSchema.superRefine((v, ctx) => {
  const index = v.documents.findIndex((d) => d.kind === 'VISA');
  const visa = index === -1 ? null : v.documents[index];

  if (visa?.expiresAt && visa.expiresAt < today()) {
    ctx.addIssue({
      code: 'custom',
      path: ['documents', index, 'expiresAt'],
      message: 'Visa expiry must be in the future',
    });
  }
});

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
