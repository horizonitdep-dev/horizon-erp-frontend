import type { EmployeeDocument } from '@/features/employees/types';

/**
 * The Operations module's own types. Nothing here redeclares a subset inline.
 *
 * `Worker` is the person as Operations sees him: read-only, owned by HR, and
 * reached through the placement relation. There is no create or update shape
 * for him in this module, deliberately — adding one is how the boundary gets
 * broken by accident.
 */

export const PLACEMENT_KINDS = [
  'PROJECT',
  'IDLE',
  'IDLE_PENDING',
  'SITE_FINISHED',
  'NEW_ARRIVAL',
  'WAITING_FOR_ARRIVAL_DATE',
  'WAITING_FOR_TICKET',
  'NO_VISA_SEND_BACK',
  'LEAVE',
  'UNDER_CANCELLATION',
  'CHECK_INSURANCE_CANCELLATION',
  'ABSCONDING',
  'DELETED',
] as const;

export type PlacementKind = (typeof PLACEMENT_KINDS)[number];

/** Every kind except PROJECT, which needs a project rather than a status. */
export const STATUS_KINDS = PLACEMENT_KINDS.filter(
  (kind): kind is Exclude<PlacementKind, 'PROJECT' | 'DELETED'> =>
    kind !== 'PROJECT' && kind !== 'DELETED',
);

export const EMPLOYEE_GROUPS = [
  'ONGOING',
  'IDLE',
  'NEW_ARRIVALS',
  'LEAVE',
  'UNDER_CANCELLATION',
  'MARKUP',
  'STAFF',
  'UNPLACED',
  'ARCHIVED',
] as const;

export type EmployeeGroup = (typeof EMPLOYEE_GROUPS)[number];

export const PROJECT_TYPES = ['SITE', 'MARKUP', 'INTERNAL'] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];
export const MANAGED_BY = ['BUSINESS', 'OPERATIONS', 'JOINT'] as const;
export type ManagedBy = (typeof MANAGED_BY)[number];
export const ACCOMMODATIONS = ['CLIENT', 'HORIZON'] as const;
export type Accommodation = (typeof ACCOMMODATIONS)[number];
export type TradeCategory = 'SITE' | 'MARKUP' | 'OFFICE';

export interface Trade {
  id: string;
  name: string;
  category: TradeCategory;
  sortOrder: number;
  isActive: boolean;
}

export interface Actor {
  id: string;
  fullName: string;
}

/** The project a placement points at, as it arrives on a placement. */
export interface PlacementProject {
  id: string;
  name: string;
  location: string | null;
  type: ProjectType;
}

export interface Placement {
  id: string;
  employeeId: string;
  kind: PlacementKind;
  projectId: string | null;
  /** D.O.J on the sheet. */
  startDate: string;
  /** L.W.D on the sheet — null while the placement is open. */
  endDate: string | null;
  accommodation: Accommodation | null;
  accommodationNote: string | null;
  remark: string | null;
  createdAt: string;
  project: PlacementProject | null;
  createdBy: Actor | null;
}

/**
 * The person. Every field belongs to HR and is rendered, never edited — see
 * the module rule in the guide §3.
 */
export interface Worker {
  id: string;
  /** HIRS's own code, always present. */
  employeeCode: string;
  /** The labour file number, null until the visa has been processed. */
  fileNo: string | null;
  name: string;
  /** Current documents only — the passport and visa are read out of these. */
  documents: EmployeeDocument[];
  nationality: string;
  employmentStatus: 'ACTIVE' | 'CANCELLED';
  trade: { id: string; name: string; category: TradeCategory } | null;
}

/** One row of the master list. */
export interface WorkerRow extends Worker {
  current: Placement | null;
  /** FROM SITE on the sheet. */
  previous: Placement | null;
  group: EmployeeGroup;
}

/** The worker detail page: the row, plus everywhere he has ever been. */
export interface WorkerDetail extends WorkerRow {
  /** Derived from history, never stored — it cannot go stale. */
  lastRejoinDate: string | null;
  history: Placement[];
}

export interface MasterListParams {
  group?: EmployeeGroup;
  kind?: PlacementKind;
  projectId?: string;
  tradeId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'employeeCode' | 'fileNo' | 'startDate';
  sortOrder?: 'asc' | 'desc';
}

/** A labelled total. Never one ambiguous "Total" — see the guide §8. */
export interface LabelledTotal {
  label: string;
  count: number;
  groups: readonly EmployeeGroup[];
}

export interface MasterSummary {
  groups: Record<EmployeeGroup, number>;
  totals: {
    horizonWorkforce: LabelledTotal;
    includingMarkup: LabelledTotal;
  };
  /** Reported on its own: a candidate nobody has placed is a task, not a headcount. */
  unplaced: number;
}

/** One request moves one or more people to one destination on one date. */
export interface MovePayload {
  employeeIds: string[];
  kind: PlacementKind;
  projectId?: string;
  date: string;
  accommodation?: Accommodation;
  accommodationNote?: string;
  remark?: string;
}

export interface MoveResult {
  employeeId: string;
  fromPlacementId: string | null;
  placement: Placement;
}

export interface UndoResult {
  undonePlacementId: string;
  reopenedPlacementId: string | null;
  nowUnplaced: boolean;
}

/** One row of the movement log — who went where, from where, on what date. */
export interface Movement {
  date: string;
  employee: Worker;
  from: Placement | null;
  to: Placement;
  recordedBy: Actor | null;
  remark: string | null;
}

export interface MovementParams {
  from?: string;
  to?: string;
  projectId?: string;
}

export interface TradeCount {
  tradeId: string;
  name: string;
  count: number;
}

export interface Project {
  id: string;
  name: string;
  location: string | null;
  type: ProjectType;
  managedBy: ManagedBy | null;
  accommodation: Accommodation | null;
  inDailyReport: boolean;
  finishedAt: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
  headcount: number;
  byTrade: TradeCount[];
}

export interface ProjectDetail extends Project {
  workers: (Placement & { employee: Pick<Worker, 'id' | 'employeeCode' | 'fileNo' | 'name'> & { trade: { id: string; name: string } | null } })[];
}

export interface ProjectParams {
  type?: ProjectType;
  managedBy?: ManagedBy;
  active?: boolean;
}

export interface ProjectPayload {
  name: string;
  location?: string;
  type: ProjectType;
  managedBy?: ManagedBy;
  accommodation?: Accommodation;
  inDailyReport?: boolean;
  remark?: string;
}

/** One row of the daily report matrix — a project, or a status. */
export interface MatrixRow {
  id: string;
  label: string;
  kind?: string;
  managedBy?: ManagedBy | null;
  type?: ProjectType;
  /** One per column, in column order. Zero renders as blank, never "0". */
  counts: number[];
  total: number;
}

export interface DailyLog {
  date: string;
  foodReceived: number | null;
  rooms: number | null;
  capacity: number | null;
  occupancy: number | null;
  /** Computed by the API, never an input. */
  vacant: number | null;
  note: string | null;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  model: string;
  plateNo: string;
  assignment: string | null;
}

export interface ExpectedArrival {
  id: string;
  date: string;
  tradeId: string;
  count: number;
  trade: { id: string; name: string };
}

export interface DailyReport {
  date: string;
  columns: { id: string; name: string }[];
  rows: MatrixRow[];
  columnTotals: number[];
  grandTotal: number;
  /** Counted in the totals but in no column — nobody has set their trade. */
  withoutTrade: number;
  camp: DailyLog | null;
  vehicles: Vehicle[];
  expectedArrivals: ExpectedArrival[];
}

export interface DailyLogPayload {
  foodReceived?: number | null;
  rooms?: number | null;
  capacity?: number | null;
  occupancy?: number | null;
  note?: string | null;
}

export interface VehiclePayload {
  model: string;
  plateNo: string;
  assignment?: string;
}

export interface ExpectedArrivalPayload {
  date: string;
  tradeId: string;
  count: number;
}
