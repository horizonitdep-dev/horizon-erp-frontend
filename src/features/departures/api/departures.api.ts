import { api } from '@/core/api/client';
import { unwrap, type ApiEnvelope, type Paginated } from '@/core/api/unwrap';
import type {
  ClearancePayload,
  Departure,
  DepartureListItem,
  DepartureListParams,
  HrSectionPayload,
} from '../types';

/** Endpoint calls only — paths and params from the live OpenAPI spec. */

export async function listDepartures(
  params: DepartureListParams,
): Promise<Paginated<DepartureListItem>> {
  const res = await api.get<ApiEnvelope<Paginated<DepartureListItem>>>('/hr/departures', {
    params,
  });
  return unwrap(res);
}

export async function getDeparture(id: string): Promise<Departure> {
  const res = await api.get<ApiEnvelope<Departure>>(`/hr/departures/${id}`);
  return unwrap(res);
}

/** Panel 1. Nothing is required; HR saves what they know. */
export async function updateHrSection(
  id: string,
  payload: Partial<HrSectionPayload>,
): Promise<Departure> {
  const res = await api.patch<ApiEnvelope<Departure>>(`/hr/departures/${id}`, payload);
  return unwrap(res);
}

/**
 * Panel 2 — maker/checker. Operations staff below the Operations Manager save
 * and submit; the Operations Manager approves or rejects. Save only works while
 * awaiting clearance or after a rejection (409 otherwise).
 */
export async function saveClearance(
  id: string,
  payload: Partial<ClearancePayload>,
): Promise<Departure> {
  const res = await api.patch<ApiEnvelope<Departure>>(`/hr/departures/${id}/clearance`, payload);
  return unwrap(res);
}

/** Sends the saved section to the Operations Manager. 400 lists missing fields. */
export async function submitClearance(id: string): Promise<Departure> {
  const res = await api.post<ApiEnvelope<Departure>>(`/hr/departures/${id}/clearance/submit`);
  return unwrap(res);
}

export async function approveClearance(id: string): Promise<Departure> {
  const res = await api.post<ApiEnvelope<Departure>>(`/hr/departures/${id}/clearance/approve`);
  return unwrap(res);
}

/** A note is required; it is shown to Operations until they resubmit. */
export async function rejectClearance(id: string, note: string): Promise<Departure> {
  const res = await api.post<ApiEnvelope<Departure>>(`/hr/departures/${id}/clearance/reject`, {
    note,
  });
  return unwrap(res);
}

/** Final HR / MD approval. No role argument — the server fills the caller's own slot. */
export async function approveDeparture(id: string): Promise<Departure> {
  const res = await api.post<ApiEnvelope<Departure>>(`/hr/departures/${id}/approve`);
  return unwrap(res);
}
