import { api } from '@/core/api/client';
import { unwrap, type ApiEnvelope, type Paginated } from '@/core/api/unwrap';
import type { Departure } from '@/features/departures/types';
import type {
  Employee,
  EmployeeDocument,
  EmployeeDocumentPayload,
  EmployeeListParams,
  EmployeeOptions,
  EmployeePayload,
  EmployeeStats,
} from '../types';

/** Endpoint calls only — paths and params taken from the live OpenAPI spec. */

export async function listEmployees(params: EmployeeListParams): Promise<Paginated<Employee>> {
  const res = await api.get<ApiEnvelope<Paginated<Employee>>>('/hr/employees', { params });
  return unwrap(res);
}

export async function getEmployee(id: string): Promise<Employee> {
  const res = await api.get<ApiEnvelope<Employee>>(`/hr/employees/${id}`);
  return unwrap(res);
}

export async function createEmployee(payload: EmployeePayload): Promise<Employee> {
  const res = await api.post<ApiEnvelope<Employee>>('/hr/employees', payload);
  return unwrap(res);
}

/**
 * Documents are NOT accepted here — the API rejects them. A renewal goes
 * through addDocument below, so a save can never quietly rewrite history.
 *
 * Contact arrays replace existing rows rather than merging — per the API.
 */
export async function updateEmployee(
  id: string,
  payload: Partial<Omit<EmployeePayload, 'documents'>>,
): Promise<Employee> {
  const res = await api.patch<ApiEnvelope<Employee>>(`/hr/employees/${id}`, payload);
  return unwrap(res);
}

/**
 * Record a document, or a renewal of one. The server closes whichever it
 * replaces, so nothing here needs to know which was current.
 */
export async function addDocument(
  id: string,
  payload: EmployeeDocumentPayload,
): Promise<EmployeeDocument> {
  const res = await api.post<ApiEnvelope<EmployeeDocument>>(
    `/hr/employees/${id}/documents`,
    payload,
  );
  return unwrap(res);
}

/** Every issue of every document, history included. */
export async function listDocuments(id: string): Promise<EmployeeDocument[]> {
  const res = await api.get<ApiEnvelope<EmployeeDocument[]>>(`/hr/employees/${id}/documents`);
  return unwrap(res);
}

/**
 * There is no DELETE. Cancelling opens a draft departure record and returns it;
 * the reason for leaving is chosen on that form, not here, so it is never asked
 * for twice. A 409 means the employee already has a live departure.
 */
export async function cancelEmployee(id: string): Promise<Departure> {
  const res = await api.post<ApiEnvelope<Departure>>(`/hr/employees/${id}/cancel`);
  return unwrap(res);
}

/** Back to ACTIVE. The live departure is voided, never deleted. */
export async function reinstateEmployee(id: string): Promise<Employee> {
  const res = await api.post<ApiEnvelope<Employee>>(`/hr/employees/${id}/reinstate`);
  return unwrap(res);
}

export async function getEmployeeStats(): Promise<EmployeeStats> {
  const res = await api.get<ApiEnvelope<EmployeeStats>>('/hr/employees/stats');
  return unwrap(res);
}

/** Designations, departments, nationalities, countries and religions. */
export async function getEmployeeOptions(): Promise<EmployeeOptions> {
  const res = await api.get<ApiEnvelope<EmployeeOptions>>('/hr/employees/options');
  return unwrap(res);
}
