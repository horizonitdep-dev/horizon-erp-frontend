import { z } from 'zod';
import type { ClearancePayload, Departure, HrSectionPayload, ReasonForLeaving } from '../types';
import { REASONS_FOR_LEAVING } from '../types';

/**
 * The two editable panels. Mirrors UpdateDepartureDto and UpdateClearanceDto.
 *
 * Nothing is required: HR opens a draft and fills what they know, and the
 * server enforces completeness at stage transitions. What IS checked here is
 * shape — a time must be HH:mm, an email must be an email — plus the two
 * cross-field rules, so a save is rejected in the browser rather than by a 400.
 *
 * Every value is a string in the form, so the schema's input and output types
 * stay identical for react-hook-form. Yes/No answers are '' | 'YES' | 'NO',
 * because "not answered" is a real third state on a paper form.
 */

const text = z.string();
const isoDate = z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Use a valid date');
const time = z.string().regex(/^(([01]\d|2[0-3]):[0-5]\d)?$/, 'Use a 24-hour time, e.g. 11:55');
const yesNo = z.enum(['', 'YES', 'NO']);

export const hrSectionSchema = z
  .object({
    siteProject: text,
    location: text,
    visaCancelDate: isoDate,
    mustLeaveBy: isoDate,
    uaeContactNo: text,
    homeContactNo: text,
    emailId: z.string().refine((v) => !v.trim() || z.email().safeParse(v.trim()).success, {
      message: 'That is not a valid email',
    }),
    reason: z.enum(['', ...REASONS_FOR_LEAVING]),
    passportReceived: yesNo,
    airTicketIssued: yesNo,
    flightNumber: text,
    airlineName: text,
    departureDate: isoDate,
    departureTime: time,
    departureAirport: text,
    destinationAirport: text,
    employeeSignedDate: isoDate,
  })
  .refine((v) => !v.visaCancelDate || !v.mustLeaveBy || v.mustLeaveBy >= v.visaCancelDate, {
    path: ['mustLeaveBy'],
    message: 'Must be on or after the visa cancel date',
  })
  .refine((v) => v.airTicketIssued !== 'YES' || !!v.flightNumber.trim(), {
    path: ['flightNumber'],
    message: 'Required once the air ticket is issued',
  })
  .refine((v) => v.airTicketIssued !== 'YES' || !!v.airlineName.trim(), {
    path: ['airlineName'],
    message: 'Required once the air ticket is issued',
  });

export type HrSectionValues = z.infer<typeof hrSectionSchema>;

export const clearanceSchema = z.object({
  immigrationCleared: yesNo,
  immigrationClearedDate: isoDate,
  immigrationClearedTime: time,
  securityCleared: yesNo,
  securityClearedDate: isoDate,
  securityClearedTime: time,
  parkingTicketNo: text,
  parkingTimeIn: time,
  parkingTimeOut: time,
  driverName: text,
  driverSignedDate: isoDate,
  driverSignedTime: time,
  reportingManagerName: text,
  reportingManagerSigned: yesNo,
  remarks: text,
});

export type ClearanceValues = z.infer<typeof clearanceSchema>;

/* ══════════ MAPPING ══════════ */

const str = (v: string | null | undefined) => v ?? '';
/** API dates are full ISO instants at UTC midnight; a date input wants the day. */
const day = (v: string | null | undefined) => (v ? v.slice(0, 10) : '');
const yn = (v: boolean | null | undefined): '' | 'YES' | 'NO' => (v == null ? '' : v ? 'YES' : 'NO');

/** Blank means "not filled in", which the API stores as null. */
const nullable = (v: string) => (v.trim() ? v.trim() : null);
const bool = (v: '' | 'YES' | 'NO') => (v === '' ? null : v === 'YES');

export function toHrValues(d: Departure): HrSectionValues {
  return {
    siteProject: str(d.siteProject),
    location: str(d.location),
    visaCancelDate: day(d.visaCancelDate),
    mustLeaveBy: day(d.mustLeaveBy),
    uaeContactNo: str(d.uaeContactNo),
    homeContactNo: str(d.homeContactNo),
    emailId: str(d.emailId),
    reason: d.reason ?? '',
    passportReceived: yn(d.passportReceived),
    airTicketIssued: yn(d.airTicketIssued),
    flightNumber: str(d.flightNumber),
    airlineName: str(d.airlineName),
    departureDate: day(d.departureDate),
    departureTime: str(d.departureTime),
    departureAirport: str(d.departureAirport),
    destinationAirport: str(d.destinationAirport),
    employeeSignedDate: day(d.employeeSignedDate),
  };
}

export function toHrPayload(v: HrSectionValues): HrSectionPayload {
  return {
    siteProject: nullable(v.siteProject),
    location: nullable(v.location),
    visaCancelDate: nullable(v.visaCancelDate),
    mustLeaveBy: nullable(v.mustLeaveBy),
    uaeContactNo: nullable(v.uaeContactNo),
    homeContactNo: nullable(v.homeContactNo),
    emailId: nullable(v.emailId),
    reason: v.reason === '' ? null : (v.reason as ReasonForLeaving),
    passportReceived: bool(v.passportReceived),
    airTicketIssued: bool(v.airTicketIssued),
    flightNumber: nullable(v.flightNumber),
    airlineName: nullable(v.airlineName),
    departureDate: nullable(v.departureDate),
    departureTime: nullable(v.departureTime),
    departureAirport: nullable(v.departureAirport),
    destinationAirport: nullable(v.destinationAirport),
    employeeSignedDate: nullable(v.employeeSignedDate),
  };
}

export function toClearanceValues(d: Departure): ClearanceValues {
  return {
    immigrationCleared: yn(d.immigrationCleared),
    immigrationClearedDate: day(d.immigrationClearedDate),
    immigrationClearedTime: str(d.immigrationClearedTime),
    securityCleared: yn(d.securityCleared),
    securityClearedDate: day(d.securityClearedDate),
    securityClearedTime: str(d.securityClearedTime),
    parkingTicketNo: str(d.parkingTicketNo),
    parkingTimeIn: str(d.parkingTimeIn),
    parkingTimeOut: str(d.parkingTimeOut),
    driverName: str(d.driverName),
    driverSignedDate: day(d.driverSignedDate),
    driverSignedTime: str(d.driverSignedTime),
    reportingManagerName: str(d.reportingManagerName),
    reportingManagerSigned: yn(d.reportingManagerSigned),
    remarks: str(d.remarks),
  };
}

export function toClearancePayload(v: ClearanceValues): ClearancePayload {
  return {
    immigrationCleared: bool(v.immigrationCleared),
    immigrationClearedDate: nullable(v.immigrationClearedDate),
    immigrationClearedTime: nullable(v.immigrationClearedTime),
    securityCleared: bool(v.securityCleared),
    securityClearedDate: nullable(v.securityClearedDate),
    securityClearedTime: nullable(v.securityClearedTime),
    parkingTicketNo: nullable(v.parkingTicketNo),
    parkingTimeIn: nullable(v.parkingTimeIn),
    parkingTimeOut: nullable(v.parkingTimeOut),
    driverName: nullable(v.driverName),
    driverSignedDate: nullable(v.driverSignedDate),
    driverSignedTime: nullable(v.driverSignedTime),
    reportingManagerName: nullable(v.reportingManagerName),
    reportingManagerSigned: bool(v.reportingManagerSigned),
    remarks: nullable(v.remarks),
  };
}
