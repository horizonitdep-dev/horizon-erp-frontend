'use client';

import { useState } from 'react';
import Link from 'next/link';
import { routes } from '@/core/config/routes';
import { apiMessage } from '@/core/api/unwrap';
import { Button } from '@/components/ui/button';
import { FilterPill } from '@/components/ui/filter-pill';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states';
import { EM_DASH, formatDate } from '@/lib/format';
import { useMovements, useProjects } from '../hooks/use-operations';
import { daysAgo, groupByDate, today } from '../lib/format';
import { placementLabel, workerIdentifier } from '../lib/groups';

/**
 * Mobilization / Demobilization — who went where, from where, on what date.
 *
 * Grouped by day with a subheading, because that is how it is read: the
 * question is "what moved today", not "show me a flat list".
 */
export function MovementLog() {
  const [from, setFrom] = useState(daysAgo(7));
  const [to, setTo] = useState(today());
  const [projectId, setProjectId] = useState('');

  const query = useMovements({ from, to, projectId: projectId || undefined });
  const { data: projects } = useProjects({});

  const days = groupByDate(query.data ?? []);

  return (
    <>
      <div className="hirs-head an">
        <div>
          <h1 className="t-h1">Mobilization</h1>
          <p className="lede">
            Every placement opened in the range, with the one it replaced. Read straight from the
            placements — there is no separate movement log to fall out of step.
          </p>
        </div>
      </div>

      <section className="panel an">
        <div className="filter-bar">
          <label className="op-inline-field" htmlFor="op-from">
            <span>From</span>
            <input
              id="op-from"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>

          <label className="op-inline-field" htmlFor="op-to">
            <span>To</span>
            <input
              id="op-to"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>

          <FilterPill
            label="Project"
            value={projectId}
            options={(projects ?? []).map((p) => ({ value: p.id, label: p.name }))}
            onChange={setProjectId}
          />
        </div>

        {query.isPending ? (
          <div className="panel-skeleton">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="panel-skeleton-row" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            message={apiMessage(query.error, 'The movement log could not be loaded.')}
            action={
              <Button variant="ghost" onClick={() => query.refetch()}>
                Try again
              </Button>
            }
          />
        ) : days.length === 0 ? (
          <EmptyState
            title="Nothing moved in this range"
            message="Widen the dates, or clear the project filter."
          />
        ) : (
          <div className="ef-pbody op-days">
            {days.map((day) => (
              <section key={day.date} className="op-day">
                <h3 className="op-day-head">
                  {formatDate(day.date)}
                  <span>{day.rows.length === 1 ? '1 move' : `${day.rows.length} moves`}</span>
                </h3>

                <div className="table-scroll">
                  <table className="hirs-table">
                    <thead>
                      <tr>
                        <th>Worker</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Recorded by</th>
                        <th>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {day.rows.map((movement) => (
                        <tr key={movement.to.id}>
                          <td>
                            <Link
                              href={routes.operations.worker(movement.employee.id)}
                              className="cell-link"
                            >
                              <b>{movement.employee.name}</b>
                              <span className="mono op-sub">
                                {workerIdentifier(movement.employee)}
                              </span>
                            </Link>
                          </td>
                          <td className="cell-muted">
                            {movement.from ? placementLabel(movement.from) : 'First placement'}
                          </td>
                          <td>
                            <b>{placementLabel(movement.to)}</b>
                          </td>
                          <td className="cell-muted">
                            {movement.recordedBy?.fullName ?? EM_DASH}
                          </td>
                          <td className="cell-muted">{movement.remark ?? EM_DASH}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
