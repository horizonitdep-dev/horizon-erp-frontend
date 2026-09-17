'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { SortingState } from '@tanstack/react-table';
import { routes } from '@/core/config/routes';
import { apiMessage } from '@/core/api/unwrap';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, Skeleton, TableSkeleton } from '@/components/ui/states';
import { ExportIcon, PlusIcon } from '@/components/ui/icons';
import { EM_DASH, formatCount } from '@/lib/format';
import { useEmployees, useEmployeeOptions, useEmployeeStats } from '../hooks/use-employees';
import { EmployeeTable } from './employee-table';
import {
  EMPTY_FILTERS,
  EmployeeFilters,
  type EmployeeFilterValues,
} from './employee-filters';
import { SORTABLE_FIELDS, type EmployeeListParams, type SortableField, type VisaStatus } from '../types';

const PAGE_SIZE = 20;
const COLUMN_COUNT = 8;

/**
 * Current employees — DESIGN.md §11 module page, guide §6.4.
 * Header → four stat tiles → one panel holding filter bar, table and pagination.
 */
export function EmployeeList() {
  const [filters, setFilters] = useState<EmployeeFilterValues>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filtersKey, setFiltersKey] = useState(0);

  const params: EmployeeListParams = useMemo(() => {
    const sort = sorting[0];
    return {
      page,
      limit: PAGE_SIZE,
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.designation ? { designation: filters.designation } : {}),
      ...(filters.department ? { department: filters.department } : {}),
      ...(filters.nationality ? { nationality: filters.nationality } : {}),
      ...(filters.visaStatus ? { visaStatus: filters.visaStatus as VisaStatus } : {}),
      ...(sort && isSortable(sort.id)
        ? { sortBy: sort.id, sortOrder: sort.desc ? ('desc' as const) : ('asc' as const) }
        : {}),
    };
  }, [filters, page, sorting]);

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useEmployees(params);
  const stats = useEmployeeStats();
  const options = useEmployeeOptions();

  const employees = useMemo(() => data?.items ?? [], [data]);
  const meta = data?.meta;

  const applyFilters = (next: EmployeeFilterValues) => {
    setFilters(next);
    setPage(1);
  };

  /**
   * Clearing from outside the filter bar has to reach the search box's own
   * state. Bumping the key remounts it with the new values, which is simpler
   * and less brittle than syncing a prop into state.
   */
  const clearFilters = () => {
    applyFilters(EMPTY_FILTERS);
    setFiltersKey((k) => k + 1);
  };

  return (
    <>
      <div className="hirs-head an-fast">
        <div>
          <h1 className="t-h1">Current employees</h1>
          <p className="lede">Everyone on the books, with documents and deployment.</p>
        </div>
        <div className="head-actions">
          <Button variant="ghost" disabled title="Export is not available yet">
            <ExportIcon />
            Export
          </Button>
          <Link href={routes.hr.newEmployee} className="btn-primary">
            <PlusIcon />
            Add employee
          </Link>
        </div>
      </div>

      <div className="tile-grid">
        <StatTile label="Total active" value={stats.data?.totalActive} isPending={stats.isPending} delay={0.04} />
        <StatTile
          label="Documents expiring"
          value={stats.data?.documentsExpiring}
          isPending={stats.isPending}
          delay={0.08}
        />
        <StatTile label="On leave" value={stats.data?.onLeave} isPending={stats.isPending} delay={0.12} />
        <StatTile
          label="Joining this month"
          value={stats.data?.joiningThisMonth}
          isPending={stats.isPending}
          delay={0.16}
        />
      </div>

      <section className="panel an-fast" style={{ animationDelay: '0.2s' }}>
        <EmployeeFilters
          key={filtersKey}
          values={filters}
          options={options.data}
          resultCount={meta?.total ?? null}
          onChange={applyFilters}
        />

        {isError ? (
          <ErrorState
            message={apiMessage(error, 'The employee list could not be loaded.')}
            action={
              <Button variant="ghost" onClick={() => refetch()}>
                Try again
              </Button>
            }
          />
        ) : isPending ? (
          <div className="table-scroll">
            <table className="hirs-table">
              <TableSkeleton rows={8} columns={COLUMN_COUNT} />
            </table>
          </div>
        ) : employees.length === 0 ? (
          <EmptyState
            title={hasAnyFilter(filters) ? 'No one matches those filters' : 'No employees yet'}
            message={
              hasAnyFilter(filters)
                ? 'Clear a filter to widen the search.'
                : 'Add your first employee to start tracking documents and deployment.'
            }
            action={
              hasAnyFilter(filters) ? (
                <Button variant="ghost" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Link href={routes.hr.newEmployee} className="btn-primary">
                  <PlusIcon />
                  Add employee
                </Link>
              )
            }
          />
        ) : (
          <div data-stale={isPlaceholderData || undefined} className="table-stale-wrap">
            <EmployeeTable data={employees} sorting={sorting} onSortingChange={setSorting} />
          </div>
        )}

        {meta && meta.totalPages > 1 ? (
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            onPage={setPage}
          />
        ) : null}
      </section>
    </>
  );
}

function StatTile({
  label,
  value,
  isPending,
  delay,
}: {
  label: string;
  value: number | null | undefined;
  isPending: boolean;
  delay: number;
}) {
  return (
    <article className="stat-tile an-fast" style={{ animationDelay: `${delay}s` }}>
      <div className="lbl">{label}</div>
      <div className="v">
        {isPending ? <Skeleton className="tile-skeleton" /> : formatCount(value ?? null)}
      </div>
      <div className="f">{EM_DASH}</div>
    </article>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPage: (page: number) => void;
}) {
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav className="pagination" aria-label="Pagination">
      <span>
        {formatCount(from)}–{formatCount(to)} of {formatCount(total)}
      </span>
      <div className="pagination-pages">
        <button
          type="button"
          className="page-btn"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          ‹
        </button>
        {pageWindow(page, totalPages).map((p) => (
          <button
            key={p}
            type="button"
            className="page-btn"
            data-active={p === page}
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onPage(p)}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="page-btn"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </nav>
  );
}

/** At most five page buttons, centred on the current page. */
function pageWindow(page: number, totalPages: number): number[] {
  const span = Math.min(5, totalPages);
  let start = Math.max(1, page - Math.floor(span / 2));
  if (start + span - 1 > totalPages) start = totalPages - span + 1;
  return Array.from({ length: span }, (_, i) => start + i);
}

function hasAnyFilter(filters: EmployeeFilterValues): boolean {
  return Object.values(filters).some((value) => value !== '');
}

/** The API rejects a sortBy outside its own enum, so guard before sending one. */
function isSortable(id: string): id is SortableField {
  return (SORTABLE_FIELDS as readonly string[]).includes(id);
}
