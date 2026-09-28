'use client';

import { ChevronDownIcon } from './icons';

/**
 * A `.pill` wrapping a native select — DESIGN.md §7.
 *
 * The select carries the interaction and the accessibility for free; the pill
 * carries the design. Clearing is a separate button so the × does not fight the
 * select for the same click.
 *
 * Lives here rather than in a feature because HR and Operations both use it.
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
