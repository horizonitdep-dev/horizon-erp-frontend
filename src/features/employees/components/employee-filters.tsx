'use client';

import { useEffect, useRef, useState } from 'react';
import { SearchIcon } from '@/components/ui/icons';
import { FilterPill } from '@/components/ui/filter-pill';
import { formatCount } from '@/lib/format';
import { useTrades } from '@/core/reference/use-trades';
import { VISA_STATUS_LABELS, VISA_STATUSES, type EmployeeOptions } from '../types';

/**
 * Filter bar — DESIGN.md §7. Debounced search, then the filters the API
 * actually supports: trade, department, nationality and visa status.
 *
 * Department and nationality come from GET /hr/employees/options. Trades come
 * from GET /operations/trades instead — they are shared reference data, so
 * neither module owns the list.
 */

export type EmployeeFilterValues = {
  search: string;
  tradeId: string;
  department: string;
  nationality: string;
  visaStatus: string;
};

export const EMPTY_FILTERS: EmployeeFilterValues = {
  search: '',
  tradeId: '',
  department: '',
  nationality: '',
  visaStatus: '',
};

const VISA_OPTIONS = VISA_STATUSES.map((value) => ({
  value,
  label: VISA_STATUS_LABELS[value],
}));

export function EmployeeFilters({
  values,
  options,
  resultCount,
  onChange,
}: {
  values: EmployeeFilterValues;
  options: EmployeeOptions | undefined;
  resultCount: number | null;
  onChange: (next: EmployeeFilterValues) => void;
}) {
  // Trades are shared reference data, so they come from core/ rather than
  // from HR's own options endpoint.
  const { data: trades } = useTrades();

  // Local mirror so typing stays responsive; only the debounced value reaches
  // the API. The timer lives in the change handler rather than an effect —
  // there is no external state to synchronise with, just a delayed callback.
  const [search, setSearch] = useState(values.search);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => clearTimeout(debounce.current ?? undefined), []);

  const handleSearch = (next: string) => {
    setSearch(next);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => onChange({ ...values, search: next }), 300);
  };

  const asOptions = (list: string[] | undefined) =>
    (list ?? []).map((value) => ({ value, label: value }));

  return (
    <div className="filter-bar">
      <label className="filter-search">
        <SearchIcon />
        <input
          className="filter-search-input"
          type="search"
          value={search}
          placeholder="Search name or code"
          aria-label="Search employees by name or code"
          onChange={(event) => handleSearch(event.target.value)}
        />
      </label>

      <FilterPill
        label="Designation"
        value={values.tradeId}
        options={(trades ?? []).map((trade) => ({ value: trade.id, label: trade.name }))}
        onChange={(tradeId) => onChange({ ...values, tradeId })}
      />
      <FilterPill
        label="Department"
        value={values.department}
        options={asOptions(options?.departments)}
        onChange={(department) => onChange({ ...values, department })}
      />
      <FilterPill
        label="Nationality"
        value={values.nationality}
        options={asOptions(options?.nationalities)}
        onChange={(nationality) => onChange({ ...values, nationality })}
      />
      <FilterPill
        label="Visa status"
        value={values.visaStatus}
        options={VISA_OPTIONS}
        onChange={(visaStatus) => onChange({ ...values, visaStatus })}
      />

      <span className="filter-count">
        {resultCount === null ? '' : `${formatCount(resultCount)} people`}
      </span>
    </div>
  );
}
