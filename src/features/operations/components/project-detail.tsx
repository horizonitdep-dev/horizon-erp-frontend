'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ACCESS, ACCESS_ANY, hasAnyAccess } from '@/core/config/access';
import { routes } from '@/core/config/routes';
import { apiMessage } from '@/core/api/unwrap';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ChevronDownIcon } from '@/components/ui/icons';
import { ErrorState, Skeleton } from '@/components/ui/states';
import { EM_DASH, formatCount, formatDate } from '@/lib/format';
import { useCanAccess } from '@/features/auth/components/access-gate';
import { useSession } from '@/features/auth/hooks/use-session';
import { useFinishProject, useProject } from '../hooks/use-operations';
import { today } from '../lib/format';
import { MANAGED_BY_LABELS, PROJECT_TYPE_LABELS, workerIdentifier } from '../lib/groups';

export function ProjectDetail({ projectId }: { projectId: string }) {
  const query = useProject(projectId);
  const finish = useFinishProject(projectId);
  const [finishing, setFinishing] = useState(false);
  const [finishDate, setFinishDate] = useState(today());

  const { user } = useSession();
  const canWrite = hasAnyAccess(user, ACCESS_ANY.operationsProjectWrite);
  const canFinish = useCanAccess(ACCESS.operationsMove);

  if (query.isPending) {
    return (
      <div className="panel">
        <div className="panel-skeleton">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="panel-skeleton-row" />
          ))}
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="panel">
        <ErrorState
          message={apiMessage(query.error, 'That project could not be loaded.')}
          action={
            <Link href={routes.operations.projects} className="btn-ghost">
              Back to projects
            </Link>
          }
        />
      </div>
    );
  }

  const project = query.data;

  return (
    <>
      <nav className="ef-crumb an" aria-label="Breadcrumb">
        <Link href={routes.operations.projects}>Projects</Link>
        <ChevronDownIcon size={13} className="crumb-chevron" />
        <span>{project.name}</span>
      </nav>

      <div className="hirs-head an">
        <div>
          <h1 className="t-h1">{project.name}</h1>
          <p className="lede">
            {project.location ? `${project.location} · ` : ''}
            {PROJECT_TYPE_LABELS[project.type]}
            {project.managedBy ? ` · ${MANAGED_BY_LABELS[project.managedBy]}` : ''}
            {project.finishedAt ? ` · finished ${formatDate(project.finishedAt)}` : ''}
          </p>
        </div>
        <div className="head-actions">
          {canWrite ? (
            <Link href={routes.operations.editProject(project.id)} className="btn-ghost">
              Edit
            </Link>
          ) : null}
          {canFinish && !project.finishedAt ? (
            <Button variant="ghost" onClick={() => setFinishing(true)}>
              Finish project
            </Button>
          ) : null}
        </div>
      </div>

      <div className="tile-grid an">
        <article className="stat-tile">
          <div className="lbl">On site now</div>
          <div className="v">{formatCount(project.headcount)}</div>
        </article>
        {project.byTrade.slice(0, 3).map((trade) => (
          <article key={trade.tradeId} className="stat-tile">
            <div className="lbl">{trade.name}</div>
            <div className="v">{formatCount(trade.count)}</div>
          </article>
        ))}
      </div>

      <section className="panel an">
        <header className="ef-phead">
          <div>
            <h2>Current workers</h2>
            <p className="note">Everyone whose open placement is on this project.</p>
          </div>
        </header>

        {project.workers.length === 0 ? (
          <div className="ef-pbody">
            <p className="dp-lock">
              Nobody is placed here. Select workers on the master list and move them to this
              project.
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="hirs-table">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Trade</th>
                  <th>D.O.J</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {project.workers.map((placement) => (
                  <tr key={placement.id}>
                    <td>
                      <Link
                        href={routes.operations.worker(placement.employee.id)}
                        className="cell-link"
                      >
                        <b>{placement.employee.name}</b>
                        <span className="mono op-sub">{workerIdentifier(placement.employee)}</span>
                      </Link>
                    </td>
                    <td>{placement.employee.trade?.name ?? EM_DASH}</td>
                    <td className="mono">{formatDate(placement.startDate)}</td>
                    <td className="cell-muted">{placement.remark ?? EM_DASH}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={finishing}
        title={`Finish ${project.name}?`}
        confirmLabel="Finish project"
        isPending={finish.isPending}
        onClose={() => setFinishing(false)}
        onConfirm={() => finish.mutate(finishDate, { onSettled: () => setFinishing(false) })}
      >
        <p>
          {project.headcount === 0
            ? 'Nobody is on this project, so nothing moves.'
            : `${project.headcount} worker${project.headcount === 1 ? '' : 's'} will be moved to Site finished on this date.`}
        </p>
        <label className="op-field" htmlFor="op-finish-date">
          <span className="op-label">Finish date</span>
          <input
            id="op-finish-date"
            type="date"
            value={finishDate}
            onChange={(event) => setFinishDate(event.target.value)}
          />
        </label>
      </ConfirmDialog>
    </>
  );
}
