import { api } from '@/core/api/client';
import { unwrap, type ApiEnvelope, type Paginated } from '@/core/api/unwrap';
import type {
  DailyLog,
  DailyLogPayload,
  DailyReport,
  ExpectedArrival,
  ExpectedArrivalPayload,
  MasterListParams,
  MasterSummary,
  MovePayload,
  MoveResult,
  Movement,
  MovementParams,
  Project,
  ProjectDetail,
  ProjectParams,
  ProjectPayload,
  UndoResult,
  Vehicle,
  VehiclePayload,
  WorkerDetail,
  WorkerRow,
} from '../types';

/**
 * Endpoint calls only — paths from the Operations backend module.
 *
 * There is deliberately no createWorker or updateWorker here. Operations never
 * writes person data; HR's form does. Where an edit would go, the UI links to
 * the HR record instead.
 */

// ── master list ──────────────────────────────────────────────────────────────

export async function listWorkers(params: MasterListParams): Promise<Paginated<WorkerRow>> {
  const res = await api.get<ApiEnvelope<Paginated<WorkerRow>>>('/operations/employees', { params });
  return unwrap(res);
}

export async function getWorker(id: string): Promise<WorkerDetail> {
  const res = await api.get<ApiEnvelope<WorkerDetail>>(`/operations/employees/${id}`);
  return unwrap(res);
}

export async function getSummary(): Promise<MasterSummary> {
  const res = await api.get<ApiEnvelope<MasterSummary>>('/operations/master/summary');
  return unwrap(res);
}

// ── moves ────────────────────────────────────────────────────────────────────

/**
 * One call moves everyone in the list. All-or-nothing: a rejected batch names
 * the worker and the reason, and nothing is written.
 */
export async function moveWorkers(payload: MovePayload): Promise<MoveResult[]> {
  const res = await api.post<ApiEnvelope<MoveResult[]>>('/operations/employees/move', payload);
  return unwrap(res);
}

/** Reverses the last move only — the correction path. */
export async function undoMove(employeeId: string): Promise<UndoResult> {
  const res = await api.post<ApiEnvelope<UndoResult>>(
    `/operations/employees/${employeeId}/undo-move`,
  );
  return unwrap(res);
}

export async function listMovements(params: MovementParams): Promise<Movement[]> {
  const res = await api.get<ApiEnvelope<Movement[]>>('/operations/movements', { params });
  return unwrap(res);
}

// ── projects ─────────────────────────────────────────────────────────────────

export async function listProjects(params: ProjectParams): Promise<Project[]> {
  const res = await api.get<ApiEnvelope<Project[]>>('/operations/projects', { params });
  return unwrap(res);
}

export async function getProject(id: string): Promise<ProjectDetail> {
  const res = await api.get<ApiEnvelope<ProjectDetail>>(`/operations/projects/${id}`);
  return unwrap(res);
}

export async function createProject(payload: ProjectPayload): Promise<Project> {
  const res = await api.post<ApiEnvelope<Project>>('/operations/projects', payload);
  return unwrap(res);
}

export async function updateProject(
  id: string,
  payload: Partial<ProjectPayload>,
): Promise<Project> {
  const res = await api.patch<ApiEnvelope<Project>>(`/operations/projects/${id}`, payload);
  return unwrap(res);
}

/** Moves everyone still on the project to Site Finished on that date. */
export async function finishProject(
  id: string,
  date: string,
): Promise<{ projectId: string; finishedAt: string; workersMoved: number }> {
  const res = await api.post<ApiEnvelope<{ projectId: string; finishedAt: string; workersMoved: number }>>(
    `/operations/projects/${id}/finish`,
    { date },
  );
  return unwrap(res);
}

// ── daily report ─────────────────────────────────────────────────────────────

export async function getDailyReport(date: string): Promise<DailyReport> {
  const res = await api.get<ApiEnvelope<DailyReport>>('/operations/daily-report', {
    params: { date },
  });
  return unwrap(res);
}

export async function saveDailyLog(date: string, payload: DailyLogPayload): Promise<DailyLog> {
  const res = await api.put<ApiEnvelope<DailyLog>>(`/operations/daily-logs/${date}`, payload);
  return unwrap(res);
}

// ── vehicles ─────────────────────────────────────────────────────────────────

export async function listVehicles(): Promise<Vehicle[]> {
  const res = await api.get<ApiEnvelope<Vehicle[]>>('/operations/vehicles');
  return unwrap(res);
}

export async function createVehicle(payload: VehiclePayload): Promise<Vehicle> {
  const res = await api.post<ApiEnvelope<Vehicle>>('/operations/vehicles', payload);
  return unwrap(res);
}

export async function updateVehicle(id: string, payload: VehiclePayload): Promise<Vehicle> {
  const res = await api.patch<ApiEnvelope<Vehicle>>(`/operations/vehicles/${id}`, payload);
  return unwrap(res);
}

export async function deleteVehicle(id: string): Promise<{ id: string }> {
  const res = await api.delete<ApiEnvelope<{ id: string }>>(`/operations/vehicles/${id}`);
  return unwrap(res);
}

// ── expected arrivals ────────────────────────────────────────────────────────

export async function listExpectedArrivals(params: {
  from?: string;
  to?: string;
}): Promise<ExpectedArrival[]> {
  const res = await api.get<ApiEnvelope<ExpectedArrival[]>>('/operations/expected-arrivals', {
    params,
  });
  return unwrap(res);
}

/** A count of zero removes the row rather than storing an empty expectation. */
export async function saveExpectedArrival(payload: ExpectedArrivalPayload): Promise<unknown> {
  const res = await api.put<ApiEnvelope<unknown>>('/operations/expected-arrivals', payload);
  return unwrap(res);
}
