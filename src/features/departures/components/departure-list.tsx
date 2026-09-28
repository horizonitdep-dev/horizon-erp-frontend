'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { SortingState } from '@tanstack/react-table';
import { routes } from '@/core/config/routes';
import { apiMessage } from '@/core/api/unwrap';
import { Button } from '@/components/ui/button';
import { SearchIcon } from '@/components/ui/icons';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/states';
import { formatCount } from '@/lib/format';
import { FilterPill } from '@/components/ui/filter-pill';
import { Pagination } from '@/components/ui/pagination';
import { useDepartures } from '../hooks/use-departures';
import {
  DEPARTURE_STAGES,
  REASON_LABELS,
  REASONS_FOR_LEAVING,
  STAGE_LABELS,
  type DepartureListParams,
  type DepartureStage,
  type ReasonForLeaving,
} from '../types';
import { DepartureTable } from './departure-table';

const PAGE_SIZE = 20;
const COLUMN_COUNT = 6;

type Filters = { search: string; reason: string; stage: string };
const EMPTY: Filters = { search: '', reason: '', stage: '' };

const REASON_OPTIONS = REASONS_FOR_LEAVING.map((value) => ({ value, label: REASON_LABELS[value] }));
const STAGE_OPTIONS = DEPARTURE_STAGES.map((value) => ({ value, label: STAGE_LABELS[value] }));

/**
 * Cancelled employees — a list of departure records, not a filtered employee
 * list. Each row is a form in progress, so the page leads with where each one
 * is stuck: stage, and which of the two approvals are in.
 */
export function DepartureList() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchKey, setSearchKey] = useState(0);

  const params: DepartureListParams = useMemo(() => {
    const sort = sorting[0];
    return {
      page,
      limit: PAGE_SIZE,
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.reason ? { reason: filters.reason as ReasonForLeaving } : {}),
      ...(filters.stage ? { stage: filters.stage as DepartureStage } : {}),
      ...(sort?.id === 'departureDate'
        ? { sortBy: 'departureDate' as const, sortOrder: sort.desc ? ('desc' as const) : ('asc' as const) }
        : {}),
    };
  }, [filters, page, sorting]);

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useDepartures(params);
  const items = useMemo(() => data?.items ?? [], [data]);
  const meta = data?.meta;
  const filtered = Object.values(filters).some((v) => v !== '');

  const apply = (next: Filters) => {
    setFilters(next);
    setPage(1);
  };

  const clear = () => {
    apply(EMPTY);
    setSearchKey((k) => k + 1);
  };

  return (
    <>
      <div className="hirs-head an-fast">
        <div>
          <h1 className="t-h1">Cancelled employees</h1>
          <p className="lede">
            Departure records in progress and complete. Cancel an employee from their record to start
            one.
          </p>
        </div>
      </div>

      <section className="panel an-fast" style={{ animationDelay: '0.08s' }}>
        <div className="filter-bar">
          <SearchBox key={searchKey} initial={filters.search} onSearch={(search) => apply({ ...filters, search })} />
          <FilterPill
            label="Reason"
            value={filters.reason}
            options={REASON_OPTIONS}
            onChange={(reason) => apply({ ...filters, reason })}
          />
          <FilterPill
            label="Stage"
            value={filters.stage}
            options={STAGE_OPTIONS}
            onChange={(stage) => apply({ ...filters, stage })}
          />
          <span className="filter-count">
            {meta ? `${formatCount(meta.total)} ${meta.total === 1 ? 'record' : 'records'}` : ''}
          </span>
        </div>

        {isError ? (
          <ErrorState
            message={apiMessage(error, 'The departure list could not be loaded.')}
            action={
              <Button variant="ghost" onClick={() => refetch()}>
                Try again
              </Button>
            }
          />
        ) : isPending ? (
          <div className="table-scroll">
            <table className="hirs-table">
              <TableSkeleton rows={6} columns={COLUMN_COUNT} />
            </table>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title={filtered ? 'No records match those filters' : 'No cancelled employees'}
            message={
              filtered
                ? 'Clear a filter to widen the search. Voided records only show under the Voided stage.'
                : 'When an employee is cancelled, their departure form appears here until both approvals are in.'
            }
            action={
              filtered ? (
                <Button variant="ghost" onClick={clear}>
                  Clear filters
                </Button>
              ) : (
                <Link href={routes.hr.employees} className="btn-ghost">
                  Current employees
                </Link>
              )
            }
          />
        ) : (
          <div data-stale={isPlaceholderData || undefined} className="table-stale-wrap">
            <DepartureTable data={items} sorting={sorting} onSortingChange={setSorting} />
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

/** Debounced so only the settled value reaches the API. */
function SearchBox({ initial, onSearch }: { initial: string; onSearch: (value: string) => void }) {
  const [value, setValue] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  return (
    <label className="filter-search">
      <SearchIcon />
      <input
        className="filter-search-input"
        type="search"
        value={value}
        placeholder="Search name, code or reference"
        aria-label="Search departures by employee name, code or reference number"
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => onSearch(next), 300);
        }}
      />
    </label>
  );
}
