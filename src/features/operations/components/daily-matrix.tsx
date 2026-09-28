'use client';

import { EmptyState } from '@/components/ui/states';
import { cell } from '../lib/format';
import type { DailyReport } from '../types';

/**
 * The headcount matrix: projects then statuses down, trades across.
 *
 * ZERO RENDERS BLANK, as the sheet does. A grid of zeros is unreadable; blanks
 * make the occupied cells jump out, which is the whole point of the view.
 *
 * The first column and the header row are frozen because the grid runs ~30
 * trades wide and a project name that scrolls away makes the numbers useless.
 */
export function DailyMatrix({ report }: { report: DailyReport }) {
  if (report.rows.length === 0) {
    return (
      <EmptyState
        title="Nobody was placed on this date"
        message="Either no placements had started by then, or everyone is on a project that is hidden from the daily report."
      />
    );
  }

  return (
    <>
      <div className="matrix-wrap">
        <table className="matrix">
          <thead>
            <tr>
              <th scope="col">Project / status</th>
              {report.columns.map((column) => (
                <th key={column.id} scope="col">
                  {column.name}
                </th>
              ))}
              <th scope="col" className="total">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.label}</th>
                {report.columns.map((column, i) => (
                  <td key={column.id}>{cell(row.counts[i] ?? 0)}</td>
                ))}
                <td className="total">{row.total}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="total">
                Total
              </th>
              {report.columns.map((column, i) => (
                <td key={column.id} className="total">
                  {cell(report.columnTotals[i] ?? 0)}
                </td>
              ))}
              <td className="total grand">{report.grandTotal}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* At phone width the grid becomes one card per row, non-zero trades only. */}
      <div className="matrix-cards">
        {report.rows.map((row) => (
          <article key={row.id} className="matrix-card">
            <h4>
              {row.label}
              <span>{row.total}</span>
            </h4>
            <dl>
              {report.columns.map((column, i) => {
                const count = row.counts[i] ?? 0;

                return count === 0 ? null : (
                  <div key={column.id}>
                    <dt>{column.name}</dt>
                    <dd>{count}</dd>
                  </div>
                );
              })}
            </dl>
          </article>
        ))}
      </div>

      {report.withoutTrade > 0 ? (
        <p className="op-note-inline">
          {report.withoutTrade} {report.withoutTrade === 1 ? 'worker has' : 'workers have'} no trade
          set, so {report.withoutTrade === 1 ? 'he is' : 'they are'} in no column. HR sets the trade
          on the employee record.
        </p>
      ) : null}
    </>
  );
}
