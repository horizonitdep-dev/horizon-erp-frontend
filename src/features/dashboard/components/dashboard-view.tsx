'use client';

import { useState } from 'react';
import { MODULES } from '@/core/config/modules';
import { apiMessage } from '@/core/api/unwrap';
import { Button } from '@/components/ui/button';
import { ErrorState, Skeleton } from '@/components/ui/states';
import { EM_DASH, formatCount, formatCurrency, formatDate } from '@/lib/format';
import { useDashboard } from '../hooks/use-dashboard';
import type { AttentionItem, DashboardRange, DashboardSummary } from '../types';

/**
 * Dashboard — DESIGN.md §11. Content at 1320px, 40px padding.
 * Five KPI cards, then a 2fr/1fr grid, then the full-width deployment chart.
 *
 * Every panel has a loading skeleton, an empty state and an error state.
 * A KPI with no data shows `—`, not `0`.
 */

const RANGES: { id: DashboardRange; label: string }[] = [
  { id: 'month', label: 'This month' },
  { id: 'quarter', label: 'Quarter' },
  { id: 'year', label: 'Year' },
];

/** The five departments the KPI row covers. */
const DEPARTMENTS = MODULES.filter((m) => m.id !== 'overview');

export function DashboardView() {
  const [range, setRange] = useState<DashboardRange>('month');
  const query = useDashboard(range);
  const { data, isPending, isError, error, refetch } = query;

  return (
    <>
      <div className="hirs-head hirs-head--dash an">
        <div>
          <h1 className="t-display">Overview</h1>
          <p className="date">{formatDate(new Date())}</p>
        </div>

        {/* The control changes the data. The endpoint does not exist yet, so it
            renders disabled rather than inert — a segmented control that looks
            live but does nothing is worse than one that is visibly not ready. */}
        <div className="segmented" data-disabled={isError ? 'true' : undefined}>
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              data-active={r.id === range}
              onClick={() => setRange(r.id)}
              disabled={isError}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Five cards, one per department. Overview is excluded — it is this
          page, not a department alongside the others. */}
      <div className="kpi-grid">
        {DEPARTMENTS.map((module, index) => {
          const kpi = data?.kpis.find((k) => k.id === module.id);
          return (
            <article
              className="kpi an"
              key={module.id}
              style={{ animationDelay: `${0.05 * (index + 1)}s` }}
            >
              <div className="lbl">{module.label}</div>
              <div className="big">
                {isPending ? (
                  <Skeleton className="kpi-skeleton" />
                ) : (
                  formatCount(kpi?.value ?? null)
                )}
              </div>
              <div className="sup">{kpi?.detail ?? EM_DASH}</div>
              {kpi?.alert ? (
                <div className="alert">
                  <i className={`dot dot--${kpi.alertLevel ?? 'warn'}`} />
                  {kpi.alert}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="dash-grid">
        <section className="panel an" style={{ animationDelay: '0.3s' }}>
          <header className="panel-head">
            <div>
              <h2 className="t-h4">Business by manager</h2>
              <p className="sub">Active contracts and headcount</p>
            </div>
            <span className="badge-exec">Executive</span>
          </header>
          <ManagerTable
            data={data}
            isPending={isPending}
            isError={isError}
            error={error}
            onRetry={refetch}
          />
        </section>

        <section className="panel an" style={{ animationDelay: '0.35s' }}>
          <header className="panel-head">
            <div>
              <h2 className="t-h4">Needs attention</h2>
              <p className="sub">Grouped by urgency</p>
            </div>
          </header>
          <AttentionList data={data} isPending={isPending} isError={isError} />
        </section>
      </div>

      <section className="panel an dash-chart" style={{ animationDelay: '0.4s' }}>
        <header className="panel-head">
          <div>
            <h2 className="t-h4">Deployment</h2>
            <p className="sub">People deployed per month</p>
          </div>
          <div className="legend">
            <span>
              <i className="legend-swatch-current" />
              Current month
            </span>
            <span>
              <i className="legend-swatch-past" />
              Previous months
            </span>
          </div>
        </header>
        <DeploymentChart data={data} isPending={isPending} isError={isError} />
      </section>
    </>
  );
}

function ManagerTable({
  data,
  isPending,
  isError,
  error,
  onRetry,
}: {
  data: DashboardSummary | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  if (isPending) return <PanelSkeleton rows={5} />;
  if (isError) {
    return (
      <ErrorState
        message={apiMessage(error, 'The dashboard summary could not be loaded.')}
        action={
          <Button variant="ghost" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    );
  }
  if (!data || data.managers.length === 0) {
    return (
      <div className="state">
        <h4>No managers yet</h4>
        <p>Business managers appear here once contracts are assigned.</p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="hirs-table hirs-table--dash">
        <thead>
          <tr>
            <th>Manager</th>
            <th>Clients</th>
            <th className="col-right">Headcount</th>
            <th className="col-right">Value</th>
            <th className="col-right">Margin</th>
          </tr>
        </thead>
        <tbody>
          {data.managers.map((row) => (
            <tr key={row.id} data-inert="true">
              <td>{row.manager}</td>
              <td className="cell-num">{formatCount(row.clients)}</td>
              <td className="cell-num cell-num--dash">{formatCount(row.headcount)}</td>
              <td className="cell-num cell-num--dash">{formatCurrency(row.value)}</td>
              <td className="cell-num cell-num--dash cell-pos">
                {row.margin === null ? EM_DASH : `${row.margin}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AttentionList({
  data,
  isPending,
  isError,
}: {
  data: DashboardSummary | undefined;
  isPending: boolean;
  isError: boolean;
}) {
  if (isPending) return <PanelSkeleton rows={4} />;
  if (isError) return <ErrorState message="Attention items could not be loaded." />;
  if (!data || data.attention.length === 0) {
    return (
      <div className="state">
        <h4>Nothing needs you</h4>
        <p>Expiring documents and overdue actions show up here.</p>
      </div>
    );
  }

  return (
    <div className="attn">
      {groupByHeading(data.attention).map(({ group, items }) => (
        <div key={group}>
          <div className="group">{group}</div>
          {items.map((item) => (
            <a key={item.id} href={item.href ?? undefined}>
              <i className={`dot dot--${item.level}`} />
              <span className="text">{item.text}</span>
              <span className="ago">{item.ago}</span>
            </a>
          ))}
        </div>
      ))}
    </div>
  );
}

function DeploymentChart({
  data,
  isPending,
  isError,
}: {
  data: DashboardSummary | undefined;
  isPending: boolean;
  isError: boolean;
}) {
  if (isPending) {
    return (
      <div className="bars">
        {Array.from({ length: 12 }).map((_, i) => (
          <div className="col" key={i}>
            <span className="skeleton chart-skeleton" />
          </div>
        ))}
      </div>
    );
  }
  if (isError) return <ErrorState message="Deployment figures could not be loaded." />;
  if (!data || data.deployment.length === 0) {
    return (
      <div className="state">
        <h4>No deployment history</h4>
        <p>Monthly deployment appears here once people are assigned to sites.</p>
      </div>
    );
  }

  const peak = Math.max(...data.deployment.map((m) => m.value), 1);

  return (
    <div className="bars">
      {data.deployment.map((month, index) => (
        <div className="col" key={month.month} data-current={month.current ? 'true' : undefined}>
          <div
            className="track"
            style={{ height: '100%', animationDelay: `${0.05 * index}s` }}
            title={`${month.month}: ${formatCount(month.value)}`}
          >
            <div className="fill" style={{ height: `${(month.value / peak) * 100}%` }} />
          </div>
          <span className="month">{month.month}</span>
        </div>
      ))}
    </div>
  );
}

function PanelSkeleton({ rows }: { rows: number }) {
  return (
    <div className="panel-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="panel-skeleton-row" />
      ))}
    </div>
  );
}

/**
 * "Today" / "This week" headings, preserving the order the server sent.
 * Groups are not sorted here — the API decides what is most urgent.
 */
function groupByHeading(items: AttentionItem[]): { group: string; items: AttentionItem[] }[] {
  const groups: { group: string; items: AttentionItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.group === item.group) last.items.push(item);
    else groups.push({ group: item.group, items: [item] });
  }
  return groups;
}
