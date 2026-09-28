'use client';

import { useMemo, useState } from 'react';
import { apiMessage } from '@/core/api/unwrap';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { AlertIcon } from '@/components/ui/icons';
import { formatDate } from '@/lib/format';
import { useMove, useProjects } from '../hooks/use-operations';
import { placementLabel } from '../lib/groups';
import { today } from '../lib/format';
import { PLACEMENT_KIND_LABELS } from '../lib/groups';
import { STATUS_KINDS, type Accommodation, type PlacementKind, type WorkerRow } from '../types';

/**
 * One dialog for every move: site to site, to a status, and the first
 * placement of somebody awaiting placement. There is no separate "place"
 * flow, because placing is a move from nowhere.
 *
 * Destination is TWO steps — project or status first, then which one.
 * Flattening 12 statuses and 40 projects into a single select makes the list
 * unreadable and the two kinds of destination look interchangeable.
 */
/**
 * Mounted only while it is open, so every field starts from its initial value.
 * Resetting in an effect instead would leave a date from the LAST move sitting
 * in the field — the kind of thing nobody notices until the report is wrong.
 */
export function MoveDialog({
  workers,
  onClose,
  onMoved,
}: {
  workers: WorkerRow[];
  onClose: () => void;
  onMoved: () => void;
}) {
  const move = useMove();
  const { data: projects } = useProjects({ active: true });

  const [destination, setDestination] = useState<'PROJECT' | 'STATUS'>('PROJECT');
  const [projectId, setProjectId] = useState('');
  const [kind, setKind] = useState<PlacementKind>('IDLE');
  const [date, setDate] = useState(today());
  const [accommodation, setAccommodation] = useState<Accommodation | ''>('');
  const [remark, setRemark] = useState('');

  const chosenProject = projects?.find((p) => p.id === projectId);

  /**
   * Warned, not blocked. The backend rejects a date before the current
   * placement started; saying so before they submit is more use than a 400
   * afterwards.
   */
  const tooEarly = useMemo(
    () => workers.filter((w) => w.current && date < w.current.startDate.slice(0, 10)),
    [workers, date],
  );

  const ready = destination === 'STATUS' || !!projectId;

  /** Named once: a one-worker move reads as a sentence, a batch as a count. */
  const single = workers.length === 1 ? workers[0] : undefined;
  const onlyEarly = tooEarly.length === 1 ? tooEarly[0] : undefined;

  const submit = () => {
    move.mutate(
      {
        employeeIds: workers.map((w) => w.id),
        kind: destination === 'PROJECT' ? 'PROJECT' : kind,
        projectId: destination === 'PROJECT' ? projectId : undefined,
        date,
        accommodation: accommodation || undefined,
        remark: remark.trim() || undefined,
      },
      { onSuccess: onMoved },
    );
  };

  return (
    <Dialog onClose={onClose} labelledBy="op-move-title">
        <header className="op-dialog-head">
          <h2 id="op-move-title">
            {single ? `Move ${single.name}` : `Move ${workers.length} workers`}
          </h2>
          <p className="note">
            The old placement closes and the new one opens on the same date, as the sheet does it.
          </p>
        </header>

        <div className="op-dialog-body">
          <fieldset className="op-field">
            <legend>Move to</legend>
            <div className="op-seg">
              {(['PROJECT', 'STATUS'] as const).map((option) => (
                <label key={option}>
                  <input
                    type="radio"
                    name="op-destination"
                    checked={destination === option}
                    onChange={() => setDestination(option)}
                  />
                  <span>{option === 'PROJECT' ? 'A project' : 'A status'}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {destination === 'PROJECT' ? (
            <label className="op-field" htmlFor="op-project">
              <span className="op-label">Project</span>
              <select
                id="op-project"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
              >
                <option value="">Select a project…</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.location ? `${project.name} / ${project.location}` : project.name}
                    {` — ${project.headcount} on site`}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="op-field" htmlFor="op-kind">
              <span className="op-label">Status</span>
              <select
                id="op-kind"
                value={kind}
                onChange={(event) => setKind(event.target.value as PlacementKind)}
              >
                {STATUS_KINDS.map((option) => (
                  <option key={option} value={option}>
                    {PLACEMENT_KIND_LABELS[option]}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="op-field-row">
            <label className="op-field" htmlFor="op-date">
              <span className="op-label">Date</span>
              <input
                id="op-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>

            <label className="op-field" htmlFor="op-accommodation">
              <span className="op-label">
                Accommodation <span className="op-optional">optional</span>
              </span>
              <select
                id="op-accommodation"
                value={accommodation}
                onChange={(event) => setAccommodation(event.target.value as Accommodation | '')}
              >
                <option value="">
                  {chosenProject?.accommodation
                    ? `Project default — ${chosenProject.accommodation === 'HORIZON' ? 'Horizon camp' : 'Client'}`
                    : 'Not recorded'}
                </option>
                <option value="HORIZON">Horizon camp</option>
                <option value="CLIENT">Client</option>
              </select>
            </label>
          </div>

          <label className="op-field" htmlFor="op-remark">
            <span className="op-label">
              Remark <span className="op-optional">optional</span>
            </span>
            <input
              id="op-remark"
              value={remark}
              placeholder="Site finished — shifted to Spider Access"
              onChange={(event) => setRemark(event.target.value)}
            />
          </label>

          {tooEarly.length > 0 ? (
            <p className="op-warn" role="status">
              <AlertIcon size={15} />
              <span>
                {onlyEarly
                  ? `${onlyEarly.name} started his current placement on ${formatDate(onlyEarly.current?.startDate)}`
                  : `${tooEarly.length} of these started after this date`}
                . A move cannot be dated before that, and the server will refuse it.
              </span>
            </p>
          ) : null}

          {/* Kept on screen with the selection intact — never toasted away. */}
          {move.isError ? (
            <p className="op-error" role="alert">
              <AlertIcon size={15} />
              <span>
                <b>Nothing was moved.</b> {apiMessage(move.error, 'The move was refused.')}
              </span>
            </p>
          ) : null}

          <details className="op-who">
            <summary>
              {single ? 'Who is moving' : `Who is moving (${workers.length})`}
            </summary>
            <ul>
              {workers.map((worker) => (
                <li key={worker.id}>
                  <b>{worker.name}</b>
                  <span>{worker.current ? placementLabel(worker.current) : 'Awaiting placement'}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>

        <footer className="op-dialog-foot">
          <Button variant="ghost" onClick={onClose} disabled={move.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!ready || move.isPending}>
            {move.isPending
              ? 'Moving…'
              : single
                ? 'Move worker'
                : `Move ${workers.length} workers`}
          </Button>
        </footer>
    </Dialog>
  );
}
