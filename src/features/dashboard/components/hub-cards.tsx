'use client';

import Link from 'next/link';
import { modulesForRole, type ModuleDefinition } from '@/core/config/modules';
import { DEPARTMENT_ICONS } from '@/components/ui/icons';
import { EM_DASH, formatCount, greeting, firstName } from '@/lib/format';
import { useSession } from '@/features/auth/hooks/use-session';
import { useDashboard } from '../hooks/use-dashboard';
import type { DashboardSummary } from '../types';

/**
 * Navigation hub — DESIGN.md §11. Six cards, 3 columns, 20px gap.
 * Overview and HR are active; the other four render at reduced opacity with no
 * hover lift and "Coming soon" in the stat row.
 */
export function HubCards() {
  const { user, role } = useSession();
  const { data, isPending, isError } = useDashboard('month');

  const modules = modulesForRole(role);
  const name = firstName(user?.fullName);

  return (
    <>
      <div className="hub-intro an">
        <p className="t-eyebrow hub-eyebrow">{todayLabel()}</p>
        <h1 className="t-display-xl">{headline(name, data)}</h1>
        <p className="t-body-lg">
          Everything Horizon runs on, in one place. Pick a department to get started.
        </p>
      </div>

      <div className="hub-grid">
        {modules.map((module, index) => (
          <HubCard
            key={module.id}
            module={module}
            summary={data}
            isPending={isPending}
            isError={isError}
            delay={0.04 * (index + 1)}
          />
        ))}
      </div>

      <footer className="hub-foot">
        <span>Horizon Group of Companies · Abu Dhabi</span>
        <span>Signed in as {user?.email ?? EM_DASH}</span>
      </footer>
    </>
  );
}

function HubCard({
  module,
  summary,
  isPending,
  isError,
  delay,
}: {
  module: ModuleDefinition;
  summary: DashboardSummary | undefined;
  isPending: boolean;
  isError: boolean;
  delay: number;
}) {
  const Icon = DEPARTMENT_ICONS[module.id];

  const body = (
    <>
      <div className="hub-tile">
        <Icon />
      </div>
      <h3>{module.label}</h3>
      <p>{module.description}</p>
      <div className="hub-stat">
        <ModuleStat
          module={module}
          summary={summary}
          isPending={isPending}
          isError={isError}
        />
      </div>
      {module.active ? <span className="hub-arrow">→</span> : null}
    </>
  );

  // Inactive departments are visible but do not navigate — a div, not a dead link.
  if (!module.active) {
    return (
      <div className="hub-card an-fast" data-inactive="true" style={{ animationDelay: `${delay}s` }}>
        {body}
      </div>
    );
  }

  return (
    <Link
      href={module.href}
      className="hub-card an-fast"
      style={{ animationDelay: `${delay}s` }}
    >
      {body}
    </Link>
  );
}

/**
 * Card stats come from the dashboard summary. There is no such endpoint yet, so
 * these render `—` — never a placeholder number that reads as real.
 */
function ModuleStat({
  module,
  summary,
  isPending,
  isError,
}: {
  module: ModuleDefinition;
  summary: DashboardSummary | undefined;
  isPending: boolean;
  isError: boolean;
}) {
  if (!module.active) return <span>Coming soon</span>;
  if (isPending) return <span className="skeleton hub-stat-skeleton" />;

  const kpi = summary?.kpis.find((k) => k.id === module.id);
  if (isError || !kpi || kpi.value === null) return <span>{EM_DASH}</span>;

  return (
    <>
      <span>{formatCount(kpi.value)}</span>
      {kpi.detail ? (
        <>
          <i className="dot dot--sm" />
          <span className={kpi.alertLevel === 'bad' ? 'stat-bad' : undefined}>{kpi.detail}</span>
        </>
      ) : null}
    </>
  );
}

/** "Good morning, Hamed. Six things need you today." — guide §6.2. */
function headline(name: string, summary: DashboardSummary | undefined) {
  const hello = name ? `${greeting()}, ${name}.` : `${greeting()}.`;
  const count = summary?.actionCount;

  // The count is real or it is not there. A fabricated "six" would be a lie the
  // user acts on, so without the endpoint the headline simply stops short.
  if (typeof count !== 'number') {
    return <>{hello} Here is Horizon.</>;
  }
  return (
    <>
      {hello} <span className="grad-text">{spellOut(count)}</span>{' '}
      {count === 1 ? 'thing needs' : 'things need'} you today.
    </>
  );
}

const WORDS = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five',
  'Six', 'Seven', 'Eight', 'Nine', 'Ten',
] as const;

function spellOut(n: number): string {
  return WORDS[n] ?? String(n);
}

function todayLabel(): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
}
