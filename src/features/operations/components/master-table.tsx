'use client';

import Link from 'next/link';
import { routes } from '@/core/config/routes';
import { EM_DASH, formatDate } from '@/lib/format';
import type { Placement, WorkerRow } from '../types';
import {
  ACCOMMODATION_LABELS,
  KIND_TONE,
  initials,
  placementLabel,
  workerIdentifier,
} from '../lib/groups';

/**
 * The master list. Columns follow the sheet's own order, so somebody reading
 * both sees the same thing in the same place.
 *
 * Selection is plain React state rather than TanStack's row model — the only
 * thing this table needs beyond rendering is a set of checked ids, and a table
 * instance to hold it would be more machinery than the feature.
 */
export function MasterTable({
  rows,
  selected,
  onToggle,
  onToggleAll,
  canSelect,
}: {
  rows: WorkerRow[];
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  canSelect: boolean;
}) {
  const allOnPageSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));

  return (
    <div className="table-scroll">
      <table className="hirs-table">
        <thead>
          <tr>
            {canSelect ? (
              <th className="op-check">
                <input
                  type="checkbox"
                  className="checkbox"
                  id="op-select-page"
                  checked={allOnPageSelected}
                  onChange={onToggleAll}
                  aria-label="Select everyone on this page"
                />
              </th>
            ) : null}
            <th>Worker</th>
            <th>Trade</th>
            <th>Project / status</th>
            <th>From</th>
            <th>D.O.J</th>
            <th>Accommodation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} data-selected={selected.has(row.id)}>
              {canSelect ? (
                <td className="op-check">
                  <input
                    type="checkbox"
                    className="checkbox"
                    id={`op-select-${row.id}`}
                    checked={selected.has(row.id)}
                    onChange={() => onToggle(row.id)}
                    aria-label={`Select ${row.name}`}
                  />
                </td>
              ) : null}

              <td>
                <Link href={routes.operations.worker(row.id)} className="cell-link">
                  <div className="cell-name">
                    <span className="chip">{initials(row.name)}</span>
                    <div>
                      <b>{row.name}</b>
                      <span className="mono">{workerIdentifier(row)}</span>
                    </div>
                  </div>
                </Link>
              </td>

              <td>{row.trade?.name ?? <span className="cell-muted">{EM_DASH}</span>}</td>

              <td>
                <PlacementCell placement={row.current} />
              </td>

              <td className="cell-muted">
                {row.previous ? placementLabel(row.previous) : EM_DASH}
              </td>

              <td className="mono">
                {row.current ? formatDate(row.current.startDate) : EM_DASH}
              </td>

              <td>
                <Accommodation placement={row.current} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A project name reads plainly; a status carries a dot, because it needs acting on. */
function PlacementCell({ placement }: { placement: Placement | null }) {
  if (!placement) {
    return (
      <span className="status">
        <i className="dot dot--warn" />
        Awaiting placement
      </span>
    );
  }

  if (placement.kind === 'PROJECT') {
    return <b>{placementLabel(placement)}</b>;
  }

  return (
    <span className="status">
      <i className={`dot dot--${KIND_TONE[placement.kind]}`} />
      {placementLabel(placement)}
    </span>
  );
}

function Accommodation({ placement }: { placement: Placement | null }) {
  if (!placement?.accommodation) return <span className="cell-muted">{EM_DASH}</span>;

  const label = ACCOMMODATION_LABELS[placement.accommodation] ?? placement.accommodation;

  return placement.accommodationNote ? (
    <span title={placement.accommodationNote}>{label}</span>
  ) : (
    <span>{label}</span>
  );
}
