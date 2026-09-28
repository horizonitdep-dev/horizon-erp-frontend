import type { EmployeeGroup, PlacementKind, Placement, Worker } from '../types';

/**
 * Display logic only — labels, order and tones. Pure functions, no hooks and
 * no fetching, so the same rules can be read in one place rather than
 * scattered across the components that render them.
 */

/** Tab order on the master list. ARCHIVED is deliberately last and quiet. */
export const GROUP_TABS: readonly EmployeeGroup[] = [
  'ONGOING',
  'IDLE',
  'NEW_ARRIVALS',
  'LEAVE',
  'UNDER_CANCELLATION',
  'MARKUP',
  'STAFF',
  'UNPLACED',
];

export const GROUP_LABELS: Record<EmployeeGroup, string> = {
  ONGOING: 'Ongoing projects',
  IDLE: 'Idle',
  NEW_ARRIVALS: 'New arrivals',
  LEAVE: 'Leave',
  UNDER_CANCELLATION: 'Under cancellation',
  MARKUP: 'Markup',
  STAFF: 'Staff',
  UNPLACED: 'Awaiting placement',
  ARCHIVED: 'Archived',
};

export const PLACEMENT_KIND_LABELS: Record<PlacementKind, string> = {
  PROJECT: 'On a project',
  IDLE: 'Idle',
  IDLE_PENDING: 'Idle pending',
  SITE_FINISHED: 'Site finished',
  NEW_ARRIVAL: 'New arrival',
  WAITING_FOR_ARRIVAL_DATE: 'Waiting for arrival date',
  WAITING_FOR_TICKET: 'Waiting for ticket',
  NO_VISA_SEND_BACK: 'No visa — send back',
  LEAVE: 'Leave',
  UNDER_CANCELLATION: 'Under cancellation',
  CHECK_INSURANCE_CANCELLATION: 'Check insurance cancellation',
  ABSCONDING: 'Absconding',
  DELETED: 'Archived',
};

export type Tone = 'good' | 'warn' | 'bad' | 'neutral' | 'muted';

/** A status kind's dot. On a project is the ordinary case, so it stays quiet. */
export const KIND_TONE: Record<PlacementKind, Tone> = {
  PROJECT: 'good',
  IDLE: 'warn',
  IDLE_PENDING: 'warn',
  SITE_FINISHED: 'warn',
  NEW_ARRIVAL: 'neutral',
  WAITING_FOR_ARRIVAL_DATE: 'neutral',
  WAITING_FOR_TICKET: 'neutral',
  NO_VISA_SEND_BACK: 'bad',
  LEAVE: 'warn',
  UNDER_CANCELLATION: 'bad',
  CHECK_INSURANCE_CANCELLATION: 'bad',
  ABSCONDING: 'bad',
  DELETED: 'muted',
};

/**
 * Awaiting placement is the only group that is a problem rather than a state:
 * somebody entered a person and nobody has said where he is. It gets an alert
 * tone when the count is above zero, and nothing when it is empty.
 */
export function groupTone(group: EmployeeGroup, count: number): Tone {
  if (group === 'UNPLACED') return count > 0 ? 'warn' : 'muted';
  if (group === 'UNDER_CANCELLATION') return count > 0 ? 'bad' : 'muted';
  return 'neutral';
}

/** What a row shows in the Project / Status column. */
export function placementLabel(placement: Placement | null): string {
  if (!placement) return 'Awaiting placement';

  if (placement.kind === 'PROJECT' && placement.project) {
    const { name, location } = placement.project;
    return location ? `${name} / ${location}` : name;
  }

  return PLACEMENT_KIND_LABELS[placement.kind];
}

/**
 * The identifier under a worker's name.
 *
 * The file number is what Operations recognises, so it wins when it exists.
 * Everyone has a HIRS code, which is the fallback — a candidate whose visa has
 * not been processed has no file number for weeks.
 */
export function workerIdentifier(worker: Pick<Worker, 'employeeCode' | 'fileNo'>): string {
  return worker.fileNo ?? worker.employeeCode;
}

/** Initials for the row chip. Two letters, first and last word. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : '';

  return (first + last).toUpperCase();
}

export const ACCOMMODATION_LABELS: Record<string, string> = {
  HORIZON: 'Horizon camp',
  CLIENT: 'Client',
};

export const PROJECT_TYPE_LABELS: Record<string, string> = {
  SITE: 'Site',
  MARKUP: 'Markup',
  INTERNAL: 'Internal',
};

export const MANAGED_BY_LABELS: Record<string, string> = {
  OPERATIONS: 'O.M',
  BUSINESS: 'B.D',
  JOINT: 'O.M / B.D',
};
