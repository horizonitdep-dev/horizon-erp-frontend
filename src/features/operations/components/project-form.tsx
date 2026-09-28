'use client';

import { useState } from 'react';
import { apiMessage } from '@/core/api/unwrap';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { AlertIcon } from '@/components/ui/icons';
import { useCreateProject, useUpdateProject } from '../hooks/use-operations';
import type { Accommodation, ManagedBy, Project, ProjectType } from '../types';

/**
 * Create or edit a project.
 *
 * A site project must say who runs it; markup and internal rows need not,
 * because nobody runs a visa-only company or the office in that sense. The
 * field appears and disappears rather than being disabled, since a disabled
 * required field reads as a bug.
 */
/** Mounted only while open, so each field starts from the project it is editing. */
export function ProjectForm({
  project,
  onClose,
}: {
  project?: Project;
  onClose: () => void;
}) {
  const create = useCreateProject();
  const update = useUpdateProject(project?.id ?? '');
  const mutation = project ? update : create;

  const [name, setName] = useState(project?.name ?? '');
  const [location, setLocation] = useState(project?.location ?? '');
  const [type, setType] = useState<ProjectType>(project?.type ?? 'SITE');
  const [managedBy, setManagedBy] = useState<ManagedBy>(project?.managedBy ?? 'OPERATIONS');
  const [accommodation, setAccommodation] = useState<Accommodation | ''>(
    project?.accommodation ?? '',
  );
  const [inDailyReport, setInDailyReport] = useState(project?.inDailyReport ?? true);
  const [remark, setRemark] = useState(project?.remark ?? '');

  const submit = () => {
    mutation.mutate(
      {
        name: name.trim(),
        location: location.trim() || undefined,
        type,
        managedBy: type === 'SITE' ? managedBy : undefined,
        accommodation: accommodation || undefined,
        inDailyReport,
        remark: remark.trim() || undefined,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog onClose={onClose} labelledBy="op-project-title">
        <header className="op-dialog-head">
          <h2 id="op-project-title">{project ? `Edit ${project.name}` : 'Add a project'}</h2>
          <p className="note">
            The daily report writes names as <span className="mono">PETRO CON / HABSSAN</span> —
            here they are two fields, so the location can be filtered on.
          </p>
        </header>

        <div className="op-dialog-body">
          <div className="op-field-row">
            <label className="op-field" htmlFor="op-p-name">
              <span className="op-label">Name</span>
              <input
                id="op-p-name"
                value={name}
                placeholder="PETRO CON"
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <label className="op-field" htmlFor="op-p-location">
              <span className="op-label">
                Location <span className="op-optional">optional</span>
              </span>
              <input
                id="op-p-location"
                value={location}
                placeholder="HABSSAN"
                onChange={(event) => setLocation(event.target.value)}
              />
            </label>
          </div>

          <div className="op-field-row">
            <label className="op-field" htmlFor="op-p-type">
              <span className="op-label">Type</span>
              <select
                id="op-p-type"
                value={type}
                onChange={(event) => {
                  const next = event.target.value as ProjectType;
                  setType(next);
                  // Markup and office rows are not on the daily report, so a new
                  // one of those turns the flag off rather than making somebody
                  // remember to.
                  if (!project) setInDailyReport(next === 'SITE');
                }}
              >
                <option value="SITE">Site — an ongoing project</option>
                <option value="MARKUP">Markup — visa and permit only</option>
                <option value="INTERNAL">Internal — office, camp, real estate</option>
              </select>
            </label>

            {type === 'SITE' ? (
              <label className="op-field" htmlFor="op-p-managed">
                <span className="op-label">Managed by</span>
                <select
                  id="op-p-managed"
                  value={managedBy}
                  onChange={(event) => setManagedBy(event.target.value as ManagedBy)}
                >
                  <option value="OPERATIONS">O.M — Operations</option>
                  <option value="BUSINESS">B.D — Business</option>
                  <option value="JOINT">O.M / B.D — both</option>
                </select>
              </label>
            ) : null}
          </div>

          <div className="op-field-row">
            <label className="op-field" htmlFor="op-p-accommodation">
              <span className="op-label">
                Accommodation default <span className="op-optional">optional</span>
              </span>
              <select
                id="op-p-accommodation"
                value={accommodation}
                onChange={(event) => setAccommodation(event.target.value as Accommodation | '')}
              >
                <option value="">Not set</option>
                <option value="CLIENT">Client — out site</option>
                <option value="HORIZON">Horizon camp</option>
              </select>
            </label>

            <label className="op-inline-check" htmlFor="op-p-report">
              <input
                id="op-p-report"
                type="checkbox"
                className="checkbox"
                checked={inDailyReport}
                onChange={(event) => setInDailyReport(event.target.checked)}
              />
              <span>Show on the daily report</span>
            </label>
          </div>

          <label className="op-field" htmlFor="op-p-remark">
            <span className="op-label">
              Remark <span className="op-optional">optional</span>
            </span>
            <input
              id="op-p-remark"
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
            />
          </label>

          {mutation.isError ? (
            <p className="op-error" role="alert">
              <AlertIcon size={15} />
              <span>{apiMessage(mutation.error, 'That could not be saved.')}</span>
            </p>
          ) : null}
        </div>

        <footer className="op-dialog-foot">
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={name.trim().length < 2 || mutation.isPending}>
            {mutation.isPending ? 'Saving…' : project ? 'Save project' : 'Add project'}
          </Button>
        </footer>
    </Dialog>
  );
}
