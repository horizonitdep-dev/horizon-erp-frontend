'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, SearchIcon } from '@/components/ui/icons';
import { formatCount } from '@/lib/format';
import { VISA_STATUS_LABELS, VISA_STATUSES, type EmployeeOptions } from '../types';

/**
 * Filter bar — DESIGN.md §7. Debounced search, then the filters the API
 * actually supports: designation, department, nationality and visa status.
 *
 * The option lists come from GET /hr/employees/options, so they are the full
 * set rather than whatever happened to load on the current page.
 */

export type EmployeeFilterValues = {
  search: string;
  designation: string;
  department: string;
  nationality: string;
  visaStatus: string;
};

export const EMPTY_FILTERS: EmployeeFilterValues = {
  search: '',
  designation: '',
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
        value={values.designation}
        options={asOptions(options?.designations)}
        onChange={(designation) => onChange({ ...values, designation })}
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

/**
 * A pill wrapping a native select. The select carries the interaction and the
 * accessibility for free; the pill carries the design. Clearing is a separate
 * button so the × does not fight the select for the same click.
 */
export function FilterPill({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const active = value !== '';
  const selected = options.find((o) => o.value === value);

  return (
    <div className="pill" data-active={active || undefined}>
      <span className="pill-label">{active ? (selected?.label ?? value) : label}</span>
      {active ? (
        <button
          type="button"
          className="x pill-clear"
          onClick={() => onChange('')}
          aria-label={`Clear ${label} filter`}
        >
          ×
        </button>
      ) : (
        <ChevronDownIcon />
      )}
      <select
        className="pill-select"
        value={value}
        aria-label={label}
        disabled={options.length === 0}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">All {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
