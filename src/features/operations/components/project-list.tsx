'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ACCESS_ANY, hasAnyAccess } from '@/core/config/access';
import { routes } from '@/core/config/routes';
import { apiMessage } from '@/core/api/unwrap';
import { Button } from '@/components/ui/button';
import { FilterPill } from '@/components/ui/filter-pill';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states';
import { EM_DASH, formatCount, formatDate } from '@/lib/format';
import { useSession } from '@/features/auth/hooks/use-session';
import { useProjects } from '../hooks/use-operations';
import { MANAGED_BY_LABELS, PROJECT_TYPE_LABELS } from '../lib/groups';
import type { ManagedBy, ProjectType } from '../types';

/** Ongoing projects, with live headcount — the FOR OPERATION summary. */
export function ProjectList() {
  const [type, setType] = useState<ProjectType | ''>('');
  const [managedBy, setManagedBy] = useState<ManagedBy | ''>('');
  const [activeOnly, setActiveOnly] = useState(true);

  const { user } = useSession();
  const canWrite = hasAnyAccess(user, ACCESS_ANY.operationsProjectWrite);

  const query = useProjects({
    type: type || undefined,
    managedBy: managedBy || undefined,
    active: activeOnly || undefined,
  });

  const projects = query.data ?? [];

  return (
    <>
      <div className="hirs-head an">
        <div>
          <h1 className="t-h1">Projects</h1>
          <p className="lede">
            Sites, markup companies and internal locations. Headcount is live — it comes from the
            placements, not a typed-in figure.
          </p>
        </div>
        {canWrite ? (
          <div className="head-actions">
            <Link href={routes.operations.newProject} className="btn-primary">
              Add project
            </Link>
          </div>
        ) : null}
      </div>

      <section className="panel an">
        <div className="filter-bar">
          <FilterPill
            label="Type"
            value={type}
            options={[
              { value: 'SITE', label: 'Site' },
              { value: 'MARKUP', label: 'Markup' },
              { value: 'INTERNAL', label: 'Internal' },
            ]}
            onChange={(value) => setType(value as ProjectType | '')}
          />

          <FilterPill
            label="Managed by"
            value={managedBy}
            options={[
              { value: 'OPERATIONS', label: 'O.M' },
              { value: 'BUSINESS', label: 'B.D' },
              { value: 'JOINT', label: 'O.M / B.D' },
            ]}
            onChange={(value) => setManagedBy(value as ManagedBy | '')}
          />

          <label className="op-inline-check" htmlFor="op-active-only">
            <input
              id="op-active-only"
              type="checkbox"
              className="checkbox"
              checked={activeOnly}
              onChange={(event) => setActiveOnly(event.target.checked)}
            />
            <span>Hide finished</span>
          </label>
        </div>

        {query.isPending ? (
          <div className="panel-skeleton">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="panel-skeleton-row" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            message={apiMessage(query.error, 'Projects could not be loaded.')}
            action={
              <Button variant="ghost" onClick={() => query.refetch()}>
                Try again
              </Button>
            }
          />
        ) : projects.length === 0 ? (
          <EmptyState
            title="No projects"
            message={
              activeOnly || type || managedBy
                ? 'Try clearing the filters.'
                : 'Add a project to start placing workers on it.'
            }
          />
        ) : (
          <div className="table-scroll">
            <table className="hirs-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Managed by</th>
                  <th className="op-num">Headcount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} data-voided={!!project.finishedAt}>
                    <td>
                      <Link href={routes.operations.project(project.id)} className="cell-link">
                        <b>{project.name}</b>
                      </Link>
                    </td>
                    <td className="cell-muted">{project.location ?? EM_DASH}</td>
                    <td>
                      <span className={`badge badge--${project.type.toLowerCase()}`}>
                        {PROJECT_TYPE_LABELS[project.type]}
                      </span>
                    </td>
                    <td className="cell-muted">
                      {project.managedBy ? MANAGED_BY_LABELS[project.managedBy] : EM_DASH}
                    </td>
                    <td className="op-num mono">{formatCount(project.headcount)}</td>
                    <td>
                      {project.finishedAt ? (
                        <span className="status">
                          <i className="dot dot--muted" />
                          Finished {formatDate(project.finishedAt)}
                        </span>
                      ) : (
                        <span className="status">
                          <i className="dot dot--good" />
                          Running
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
