'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '@/core/config/query-keys';
import type { Paginated } from '@/core/api/unwrap';
import {
  getEmployee,
  getEmployeeOptions,
  getEmployeeStats,
  listEmployees,
} from '../api/employees.api';
import type { Employee, EmployeeListParams, EmployeeOptions, EmployeeStats } from '../types';

/**
 * Server-side paging, sorting and filtering — the table only holds the state,
 * the API does the work.
 */
export function useEmployees(params: EmployeeListParams) {
  return useQuery<Paginated<Employee>>({
    queryKey: queryKeys.employees.list(params as Record<string, unknown>),
    queryFn: () => listEmployees(params),
    // Keeps the current page on screen while the next one loads, so paging
    // does not blank the table.
    placeholderData: keepPreviousData,
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery<Employee>({
    queryKey: queryKeys.employees.detail(id ?? ''),
    queryFn: () => getEmployee(id as string),
    enabled: !!id,
  });
}

export function useEmployeeStats() {
  return useQuery<EmployeeStats>({
    queryKey: queryKeys.employees.stats(),
    queryFn: getEmployeeStats,
  });
}

/** Lookup lists. They change rarely, so they are cached for the session. */
export function useEmployeeOptions() {
  return useQuery<EmployeeOptions>({
    queryKey: queryKeys.employees.options(),
    queryFn: getEmployeeOptions,
    staleTime: 30 * 60 * 1000,
  });
}
