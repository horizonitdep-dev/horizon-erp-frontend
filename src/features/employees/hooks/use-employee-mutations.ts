'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { queryKeys } from '@/core/config/query-keys';
import { routes } from '@/core/config/routes';
import { apiMessage, statusOf } from '@/core/api/unwrap';
import {
  cancelEmployee,
  createEmployee,
  reinstateEmployee,
  updateEmployee,
} from '../api/employees.api';
import type { Employee, EmployeePayload } from '../types';

/**
 * Every mutation shows a toast. A duplicate employee code comes back as a 409;
 * the envelope's own message is what the user sees, since the server knows
 * which code clashed and we do not.
 */

export function useCreateEmployee() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<Employee, unknown, EmployeePayload>({
    mutationFn: createEmployee,
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      toast.success(`${employee.name} added`);
      router.push(routes.hr.employees);
    },
    onError: (error) => toast.error(saveError(error)),
  });
}

export function useUpdateEmployee(id: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<Employee, unknown, Partial<EmployeePayload>>({
    mutationFn: (payload) => updateEmployee(id, payload),
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      toast.success(`${employee.name} saved`);
      router.push(routes.hr.employees);
    },
    onError: (error) => toast.error(saveError(error)),
  });
}

/**
 * Cancelling asks only for confirmation, opens a draft departure and routes
 * straight to it — the reason is picked there, among the other fields.
 *
 * A 409 means a live departure already exists. That is not a failure from the
 * user's point of view: they wanted the departure record, so they go to it.
 */
export function useCancelEmployee() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<unknown, unknown, Pick<Employee, 'id' | 'name'>>({
    mutationFn: (employee) => cancelEmployee(employee.id),
    onSuccess: (_departure, employee) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.departures.all });
      toast.success(`${employee.name} cancelled — departure form opened`);
      router.push(routes.hr.departure(employee.id));
    },
    onError: (error, employee) => {
      if (statusOf(error) === 409) {
        toast.message(`${employee.name} already has a departure record`);
        router.push(routes.hr.departure(employee.id));
        return;
      }
      toast.error(apiMessage(error, 'Could not cancel this employee.'));
    },
  });
}

/** Back to ACTIVE. The departure is voided and kept, never deleted. */
export function useReinstateEmployee() {
  const queryClient = useQueryClient();

  return useMutation<Employee, unknown, Pick<Employee, 'id' | 'name'>>({
    mutationFn: (employee) => reinstateEmployee(employee.id),
    onSuccess: (employee) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.departures.all });
      toast.success(`${employee.name} reinstated — departure voided`);
    },
    onError: (error) => toast.error(apiMessage(error, 'Could not reinstate this employee.')),
  });
}

function saveError(error: unknown): string {
  if (statusOf(error) === 409) {
    return apiMessage(error, 'That employee code is already in use.');
  }
  return apiMessage(error, 'Could not save this employee.');
}
