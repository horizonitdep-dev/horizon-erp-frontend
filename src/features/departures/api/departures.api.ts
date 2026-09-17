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

/** Panel 2. The server records who typed it and when. */
export async function updateClearance(
  id: string,
  payload: Partial<ClearancePayload>,
): Promise<Departure> {
  const res = await api.patch<ApiEnvelope<Departure>>(`/hr/departures/${id}/clearance`, payload);
  return unwrap(res);
}

/** No role argument — the server fills the caller's own slot. */
export async function approveDeparture(id: string): Promise<Departure> {
  const res = await api.post<ApiEnvelope<Departure>>(`/hr/departures/${id}/approve`);
  return unwrap(res);
}
