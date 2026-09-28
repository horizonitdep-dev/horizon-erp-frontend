'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/core/config/query-keys';
import { apiMessage, type Paginated } from '@/core/api/unwrap';
import * as api from '../api/operations.api';
import type {
  DailyLogPayload,
  DailyReport,
  ExpectedArrivalPayload,
  MasterListParams,
  MasterSummary,
  MovePayload,
  Movement,
  MovementParams,
  Project,
  ProjectParams,
  ProjectPayload,
  VehiclePayload,
  WorkerDetail,
  WorkerRow,
} from '../types';

/**
 * Every mutation in this module invalidates `['operations']` WHOLESALE.
 *
 * A move changes the master list, the group counts, the movement log, the
 * project headcount and the daily report at the same time. Invalidating each
 * of those by hand is how one of them keeps showing a stale number, and the
 * saving is nothing — this is a handful of queries, not a feed.
 */
function useOperationsMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  messages: { success: (data: TData, variables: TVariables) => string; failure: string },
) {
  const queryClient = useQueryClient();

  return useMutation<TData, unknown, TVariables>({
    mutationFn,
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.operations.all });
      toast.success(messages.success(data, variables));
    },
    onError: (error) => toast.error(apiMessage(error, messages.failure)),
  });
}

// ── master list ──────────────────────────────────────────────────────────────

export function useWorkers(params: MasterListParams) {
  return useQuery<Paginated<WorkerRow>>({
    queryKey: queryKeys.operations.master(params as Record<string, unknown>),
    queryFn: () => api.listWorkers(params),
    placeholderData: keepPreviousData,
  });
}

export function useWorker(id: string) {
  return useQuery<WorkerDetail>({
    queryKey: queryKeys.operations.worker(id),
    queryFn: () => api.getWorker(id),
    enabled: !!id,
  });
}

export function useSummary() {
  return useQuery<MasterSummary>({
    queryKey: queryKeys.operations.summary,
    queryFn: api.getSummary,
  });
}

// ── moves ────────────────────────────────────────────────────────────────────

/**
 * The move mutation deliberately does NOT toast its own error.
 *
 * A rejected batch names the worker and the reason, and the dialog has to keep
 * that message on screen with the selection intact — the user cannot act on an
 * error that has already faded. The dialog reads `error` and renders it.
 */
export function useMove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MovePayload) => api.moveWorkers(payload),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.operations.all });
      toast.success(
        result.length === 1 ? '1 worker moved' : `${result.length} workers moved`,
      );
    },
  });
}

export function useUndoMove() {
  return useOperationsMutation((employeeId: string) => api.undoMove(employeeId), {
    success: (result) =>
      result.nowUnplaced
        ? 'Move undone — the worker is awaiting placement again'
        : 'Move undone',
    failure: 'That move could not be undone.',
  });
}

export function useMovements(params: MovementParams) {
  return useQuery<Movement[]>({
    queryKey: queryKeys.operations.movements(params as Record<string, unknown>),
    queryFn: () => api.listMovements(params),
    placeholderData: keepPreviousData,
  });
}

// ── projects ─────────────────────────────────────────────────────────────────

export function useProjects(params: ProjectParams) {
  return useQuery<Project[]>({
    queryKey: queryKeys.operations.projects(params as Record<string, unknown>),
    queryFn: () => api.listProjects(params),
    placeholderData: keepPreviousData,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.operations.project(id),
    queryFn: () => api.getProject(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  return useOperationsMutation((payload: ProjectPayload) => api.createProject(payload), {
    success: (project) => `${project.name} created`,
    failure: 'That project could not be created.',
  });
}

export function useUpdateProject(id: string) {
  return useOperationsMutation(
    (payload: Partial<ProjectPayload>) => api.updateProject(id, payload),
    { success: () => 'Project saved', failure: 'That project could not be saved.' },
  );
}

export function useFinishProject(id: string) {
  return useOperationsMutation((date: string) => api.finishProject(id, date), {
    success: (result) =>
      result.workersMoved === 0
        ? 'Project finished'
        : `Project finished — ${result.workersMoved} worker${
            result.workersMoved === 1 ? '' : 's'
          } moved to Site finished`,
    failure: 'That project could not be finished.',
  });
}

// ── daily report ─────────────────────────────────────────────────────────────

export function useDailyReport(date: string) {
  return useQuery<DailyReport>({
    queryKey: queryKeys.operations.dailyReport(date),
    queryFn: () => api.getDailyReport(date),
    placeholderData: keepPreviousData,
  });
}

/** Each panel saves on its own — this page is filled in across the day. */
export function useSaveDailyLog(date: string) {
  return useOperationsMutation((payload: DailyLogPayload) => api.saveDailyLog(date, payload), {
    success: () => 'Camp figures saved',
    failure: 'The camp figures could not be saved.',
  });
}

export function useCreateVehicle() {
  return useOperationsMutation((payload: VehiclePayload) => api.createVehicle(payload), {
    success: (vehicle) => `${vehicle.plateNo} added`,
    failure: 'That vehicle could not be added.',
  });
}

export function useUpdateVehicle() {
  return useOperationsMutation(
    ({ id, ...payload }: VehiclePayload & { id: string }) => api.updateVehicle(id, payload),
    { success: () => 'Vehicle saved', failure: 'That vehicle could not be saved.' },
  );
}

export function useDeleteVehicle() {
  return useOperationsMutation((id: string) => api.deleteVehicle(id), {
    success: () => 'Vehicle removed',
    failure: 'That vehicle could not be removed.',
  });
}

export function useSaveExpectedArrival() {
  return useOperationsMutation(
    (payload: ExpectedArrivalPayload) => api.saveExpectedArrival(payload),
    { success: () => 'Expected arrivals saved', failure: 'That could not be saved.' },
  );
}
