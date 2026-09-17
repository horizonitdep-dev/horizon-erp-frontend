import { z } from 'zod';
import {
  DRIVING_LICENSE,
  FAMILY_ROLES,
  GENDERS,
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

export const employeeSchema = z
  .object({
    // ── identity ──
    employeeCode: required('Employee code'),
    name: required('Name'),
    designation: required('Designation'),
    department: required('Department'),
    reportingManager: required('Reporting manager'),

    // ── contract ──
    joiningDate: isoDate('Joining date'),
    contractStart: isoDate('Contract start'),
    contractEnd: isoDate('Contract end'),

    // ── visa ──
    visaType: z.enum(VISA_TYPES),
    visaTypeOther: optionalText,
    visaIssueDate: isoDate('Visa issue date'),
    visaExpiryDate: isoDate('Visa expiry date'),
    visitVisaNumber: optionalText,
    visitVisaIssueDate: optionalText,
    visitVisaExpiryDate: optionalText,

    // ── documents ──
    emiratesIdNumber: required('Emirates ID number'),
    emiratesIdIssueDate: isoDate('Emirates ID issue date'),
    emiratesIdExpiryDate: isoDate('Emirates ID expiry date'),
    passportNumber: required('Passport number'),
    passportCountry: required('Passport country'),
    passportIssueDate: isoDate('Passport issue date'),
    passportValidUntil: isoDate('Passport valid until'),

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
  .refine((v) => v.visaType !== 'OTHER' || !!v.visaTypeOther?.trim(), {
    path: ['visaTypeOther'],
    message: 'Describe the visa type',
  })
  .refine((v) => v.maritalStatus !== 'OTHER' || !!v.maritalStatusOther?.trim(), {
    path: ['maritalStatusOther'],
    message: 'Describe the marital status',
  })
  .refine((v) => v.drivingLicense !== 'OTHER' || !!v.drivingLicenseOther?.trim(), {
    path: ['drivingLicenseOther'],
    message: 'Describe the licence',
  })
  .refine((v) => !v.contractEnd || !v.contractStart || v.contractEnd >= v.contractStart, {
    path: ['contractEnd'],
    message: 'Contract end cannot be before it starts',
  });

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

/**
 * On create the visa must still be valid — issuing a record against an already
 * expired document is a data-entry mistake. On edit it may be in the past:
 * existing records legitimately hold lapsed visas awaiting renewal, and
 * refusing to save one would block fixing a typo.
 */
export const createEmployeeSchema = employeeSchema.refine(
  (v) => !v.visaExpiryDate || v.visaExpiryDate >= today(),
  { path: ['visaExpiryDate'], message: 'Visa expiry must be in the future' },
);

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
