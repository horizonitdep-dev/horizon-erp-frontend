'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ACCESS } from '@/core/config/access';
import { apiMessage } from '@/core/api/unwrap';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states';
import { EM_DASH, formatCount } from '@/lib/format';
import { SearchIcon } from '@/components/ui/icons';
import { FilterPill } from '@/components/ui/filter-pill';
import { Pagination } from '@/components/ui/pagination';
import { useCanAccess } from '@/features/auth/components/access-gate';
import { useTrades } from '@/core/reference/use-trades';
import { useProjects, useSummary, useWorkers } from '../hooks/use-operations';
import { GROUP_LABELS } from '../lib/groups';
import type { EmployeeGroup } from '../types';
import { GroupTabs } from './group-tabs';
import { MasterTable } from './master-table';
import { MoveDialog } from './move-dialog';
import { SelectionBar } from './selection-bar';

const PAGE_SIZE = 25;

/**
 * The main Operations screen — every worker, grouped.
 *
 * Tab, filters and page live in the URL, so a filtered list can be sent to
 * somebody and survives a refresh. That is also what makes the browser's back
 * button do what people expect after clicking into a worker.
 */
export function MasterList() {
  const router = useRouter();
  const params = useSearchParams();

  const group = (params.get('group') as EmployeeGroup) || 'ONGOING';
  const search = params.get('search') ?? '';
  const projectId = params.get('projectId') ?? '';
  const tradeId = params.get('tradeId') ?? '';
  const page = Number(params.get('page') ?? 1);

  const [searchInput, setSearchInput] = useState(search);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [moveOpen, setMoveOpen] = useState(false);

  const canMove = useCanAccess(ACCESS.operationsMove);

  const setParam = (updates: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, String(value));
    }

    // Any filter change invalidates the current page number.
    if (!('page' in updates)) next.delete('page');

    // A selection that spans a page you can no longer see is how somebody moves
    // people they did not mean to, so any navigation drops it.
    setSelected(new Set());
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  // Debounced so typing a name is not one request per keystroke.
  useEffect(() => {
    if (searchInput === search) return;

    const timer = setTimeout(() => setParam({ search: searchInput }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const query = useWorkers({
    group,
    search: search || undefined,
    projectId: projectId || undefined,
    tradeId: tradeId || undefined,
    page,
    limit: PAGE_SIZE,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const summary = useSummary();
  const { data: projects } = useProjects({ active: true });
  const { data: trades } = useTrades();

  // Memoised because selectedWorkers depends on it; a fresh [] each render
  // would recompute the selection every time.
  const rows = useMemo(() => query.data?.items ?? [], [query.data]);
  const meta = query.data?.meta;

  const selectedWorkers = useMemo(
    () => rows.filter((row) => selected.has(row.id)),
    [rows, selected],
  );

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((current) =>
      rows.every((row) => current.has(row.id)) ? new Set() : new Set(rows.map((row) => row.id)),
    );

  const filtered = !!(search || projectId || tradeId);

  return (
    <>
      <div className="hirs-head an">
        <div>
          <h1 className="t-h1">Master list</h1>
          <p className="lede">
            Every worker and where he is. Moving somebody closes his current placement and opens a
            new one — the history is never overwritten.
          </p>
        </div>
      </div>

      <StatTiles summary={summary.data} />

      <GroupTabs
        value={group}
        summary={summary.data}
        onChange={(next) => setParam({ group: next, projectId: undefined })}
      />

      <section className="panel an">
        {/* `.filter-bar`, `.filter-search` and `.pill` are the shared classes
            from DESIGN.md §7 — the ops mockup uses the same ones. */}
        <div className="filter-bar">
          <label className="filter-search">
            <SearchIcon />
            <input
              type="search"
              className="filter-search-input"
              placeholder="Search name, file number or passport"
              value={searchInput}
              aria-label="Search workers"
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>

          <FilterPill
            label="Project"
            value={projectId}
            options={(projects ?? []).map((p) => ({ value: p.id, label: p.name }))}
            onChange={(value) => setParam({ projectId: value })}
          />
          <FilterPill
            label="Trade"
            value={tradeId}
            options={(trades ?? []).map((t) => ({ value: t.id, label: t.name }))}
            onChange={(value) => setParam({ tradeId: value })}
          />

          {filtered ? (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchInput('');
                setParam({ search: undefined, projectId: undefined, tradeId: undefined });
              }}
            >
              Clear filters
            </Button>
          ) : null}

          <span className="filter-count">
            {meta ? `${formatCount(meta.total)} ${meta.total === 1 ? 'worker' : 'workers'}` : null}
          </span>
        </div>

        {query.isPending ? (
          <div className="panel-skeleton">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="panel-skeleton-row" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            message={apiMessage(query.error, 'The master list could not be loaded.')}
            action={
              <Button variant="ghost" onClick={() => query.refetch()}>
                Try again
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title={filtered ? 'No workers match those filters' : `Nobody in ${GROUP_LABELS[group]}`}
            message={
              filtered
                ? 'Try a different project, trade or search term.'
                : group === 'UNPLACED'
                  ? 'Everyone HR has entered has been placed. This is where new hires appear before Operations places them.'
                  : 'Nobody is in this group at the moment.'
            }
          />
        ) : (
          <>
            {canMove ? (
              <p className="op-select-note">
                Select-all covers <b>this page only</b> — {rows.length} of {meta?.total ?? 0}.
              </p>
            ) : null}

            <MasterTable
              rows={rows}
              selected={selected}
              onToggle={toggle}
              onToggleAll={toggleAll}
              canSelect={canMove}
            />

            {meta ? (
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                limit={meta.limit}
                noun="worker"
                onPage={(next) => setParam({ page: next })}
              />
            ) : null}
          </>
        )}
      </section>

      {canMove ? (
        <SelectionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          onMove={() => setMoveOpen(true)}
        />
      ) : null}

      {moveOpen && selectedWorkers.length > 0 ? (
        <MoveDialog
          workers={selectedWorkers}
          onClose={() => setMoveOpen(false)}
          onMoved={() => {
            setMoveOpen(false);
            setSelected(new Set());
          }}
        />
      ) : null}
    </>
  );
}

/**
 * Both totals labelled — never one ambiguous "Total".
 * `.tile-grid` / `.stat-tile` are the shared design-system classes (DESIGN.md
 * §7); the ops mockup uses the same geometry, so nothing is redefined here.
 */
function StatTiles({ summary }: { summary?: ReturnType<typeof useSummary>['data'] }) {
  const markup = summary?.groups.MARKUP;

  const tiles: { label: string; value: number | undefined; foot: string }[] = [
    {
      label: 'Horizon workforce',
      value: summary?.totals.horizonWorkforce.count,
      foot: 'excludes markup',
    },
    {
      label: 'Including markup',
      value: summary?.totals.includingMarkup.count,
      foot: markup === undefined ? EM_DASH : `${formatCount(markup)} on markup`,
    },
    {
      label: 'Awaiting placement',
      value: summary?.unplaced,
      foot: 'entered by HR, not placed',
    },
    { label: 'Idle', value: summary?.groups.IDLE, foot: 'not on a project today' },
  ];

  return (
    <div className="tile-grid an">
      {tiles.map((tile, index) => (
        <article
          key={tile.label}
          className="stat-tile an-fast"
          style={{ animationDelay: `${0.04 * (index + 1)}s` }}
        >
          <div className="lbl">{tile.label}</div>
          <div className="v">
            {tile.value === undefined ? EM_DASH : formatCount(tile.value)}
          </div>
          <div className="f">{tile.foot}</div>
        </article>
      ))}
    </div>
  );
}

