'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/core/config/query-keys';
import { apiMessage, type Paginated } from '@/core/api/unwrap';
import {
  approveDeparture,
  getDeparture,
  listDepartures,
  updateClearance,
  updateHrSection,
} from '../api/departures.api';
import type {
  ClearancePayload,
  Departure,
  DepartureListItem,
  DepartureListParams,
  HrSectionPayload,
} from '../types';

export function useDepartures(params: DepartureListParams) {
  return useQuery<Paginated<DepartureListItem>>({
    queryKey: queryKeys.departures.list(params as Record<string, unknown>),
    queryFn: () => listDepartures(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * The record page is keyed by employee. This finds that employee's most recent
 * departure — voided ones included, so a reinstated employee's record still
 * opens — then loads it in full.
 */
export function useEmployeeDeparture(employeeId: string) {
  const latest = useQuery({
    queryKey: queryKeys.departures.forEmployee(employeeId),
    queryFn: () => listDepartures({ employeeId, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  const departureId = latest.data?.items[0]?.id;

  const detail = useQuery<Departure>({
    queryKey: queryKeys.departures.detail(departureId ?? ''),
    queryFn: () => getDeparture(departureId as string),
    enabled: !!departureId,
  });

  return {
    departure: detail.data,
    /** The lookup finished and this employee has never been cancelled. */
    notFound: latest.isSuccess && !departureId,
    isPending: latest.isPending || (!!departureId && detail.isPending),
    isError: latest.isError || detail.isError,
    error: latest.error ?? detail.error,
    refetch: () => (departureId ? detail.refetch() : latest.refetch()),
  };
}

/**
 * Each panel saves on its own. The response is the whole record with its new
 * stage, so it is written straight into the cache rather than refetched — the
 * banner and the other panels move the moment the save lands.
 */
function useSaveSection<P>(
  departureId: string,
  save: (id: string, payload: P) => Promise<Departure>,
  successMessage: string,
) {
  const queryClient = useQueryClient();

  return useMutation<Departure, unknown, P>({
    mutationFn: (payload) => save(departureId, payload),
    onSuccess: (departure) => {
      queryClient.setQueryData(queryKeys.departures.detail(departure.id), departure);
      void queryClient.invalidateQueries({ queryKey: queryKeys.departures.all, refetchType: 'none' });
      toast.success(successMessage);
    },
    // Field errors are mapped onto inputs by the panel; this only announces it.
    onError: (error) => toast.error(apiMessage(error, 'That section could not be saved.')),
  });
}

export function useSaveHrSection(departureId: string) {
  return useSaveSection<Partial<HrSectionPayload>>(departureId, updateHrSection, 'HR section saved');
}

export function useSaveClearance(departureId: string) {
  return useSaveSection<Partial<ClearancePayload>>(departureId, updateClearance, 'Clearance recorded');
}

export function useApproveDeparture(departureId: string) {
  const queryClient = useQueryClient();

  return useMutation<Departure, unknown, void>({
    mutationFn: () => approveDeparture(departureId),
    onSuccess: (departure) => {
      queryClient.setQueryData(queryKeys.departures.detail(departure.id), departure);
      void queryClient.invalidateQueries({ queryKey: queryKeys.departures.all, refetchType: 'none' });
      toast.success(
        departure.stage === 'COMPLETED' ? 'Approved — the departure is complete' : 'Approval recorded',
      );
    },
    onError: (error) => toast.error(apiMessage(error, 'The approval could not be recorded.')),
  });
}
