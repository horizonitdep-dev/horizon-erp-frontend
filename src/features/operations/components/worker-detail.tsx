'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ACCESS } from '@/core/config/access';
import { routes } from '@/core/config/routes';
import { apiMessage } from '@/core/api/unwrap';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ChevronDownIcon } from '@/components/ui/icons';
import { ErrorState, Skeleton } from '@/components/ui/states';
import { EM_DASH, formatDate } from '@/lib/format';
import { AccessGate, useCanAccess } from '@/features/auth/components/access-gate';
import { currentOfKind, currentVisaType, visaLabel } from '@/features/employees/lib/documents';
import { useUndoMove, useWorker } from '../hooks/use-operations';
import { duration, placementDates } from '../lib/format';
import {
  ACCOMMODATION_LABELS,
  KIND_TONE,
  GROUP_LABELS,
  placementLabel,
  workerIdentifier,
} from '../lib/groups';
import type { Placement } from '../types';
import { MoveDialog } from './move-dialog';

/**
 * Where one man has been — the screen that replaces scrolling the spreadsheet
 * to work it out.
 *
 * The person sits in the right rail, read-only, under a heading saying HR owns
 * the record. No disabled inputs: a disabled field still invites a click, so
 * values render as text.
 */
export function WorkerDetail({ workerId }: { workerId: string }) {
  const query = useWorker(workerId);
  const undo = useUndoMove();
  const [moveOpen, setMoveOpen] = useState(false);
  const [undoOpen, setUndoOpen] = useState(false);
  const canUndo = useCanAccess(ACCESS.operationsUndo);

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
          message={apiMessage(query.error, 'That worker could not be loaded.')}
          action={
            <Link href={routes.operations.master} className="btn-ghost">
              Back to the master list
            </Link>
          }
        />
      </div>
    );
  }

  const worker = query.data;
  const previous = worker.history.find((p) => p.id !== worker.current?.id) ?? null;
  const visaType = currentVisaType(worker.documents);

  return (
    <>
      <nav className="ef-crumb an" aria-label="Breadcrumb">
        <Link href={routes.operations.master}>Operations</Link>
        <ChevronDownIcon size={13} className="crumb-chevron" />
        <span>{worker.name}</span>
      </nav>

      <div className="hirs-head an">
        <div>
          <h1 className="t-h1">{worker.name}</h1>
          <p className="lede">
            <span className="mono">{workerIdentifier(worker)}</span>
            {worker.trade ? ` · ${worker.trade.name}` : ''} · {GROUP_LABELS[worker.group]}
          </p>
        </div>
        <AccessGate rule={ACCESS.operationsMove}>
          <div className="head-actions">
            <Button onClick={() => setMoveOpen(true)}>Move worker</Button>
          </div>
        </AccessGate>
      </div>

      <div className="op-detail an">
        <section className="panel">
          <header className="ef-phead">
            <div>
              <h2>Placement history</h2>
              <p className="note">
                Newest first. Every move closes one placement and opens the next — nothing here is
                overwritten.
              </p>
            </div>
          </header>

          <div className="ef-pbody">
            {worker.history.length === 0 ? (
              <p className="dp-lock">
                Operations has not placed this worker yet. He was entered by HR and is waiting for
                somebody to say where he is.
              </p>
            ) : (
              <ol className="timeline">
                {worker.history.map((placement) => (
                  <TimelineItem
                    key={placement.id}
                    placement={placement}
                    current={placement.id === worker.current?.id}
                  />
                ))}
              </ol>
            )}
          </div>

          {canUndo && worker.current ? (
            <div className="dp-foot">
              <span className="dp-foot-note">
                Undo reverses only the most recent move. Earlier history cannot be edited.
              </span>
              <Button variant="ghost" onClick={() => setUndoOpen(true)} disabled={undo.isPending}>
                Undo last move
              </Button>
            </div>
          ) : null}
        </section>

        <aside className="op-rail">
          <section className="panel">
            <header className="ef-phead">
              <div>
                <h2>The person</h2>
                <p className="note">Managed by HR. Operations records where he is, not who he is.</p>
              </div>
            </header>

            <div className="ef-pbody">
              <dl className="op-facts">
                <Fact label="Name" value={worker.name} />
                <Fact label="Employee code" value={worker.employeeCode} mono />
                <Fact label="File number" value={worker.fileNo} mono />
                <Fact
                  label="Passport"
                  value={currentOfKind(worker.documents, 'PASSPORT')?.number}
                  mono
                />
                <Fact label="Trade" value={worker.trade?.name} />
                <Fact label="Visa type" value={visaType ? visaLabel(visaType) : null} />
                <Fact label="Nationality" value={worker.nationality} />
                <Fact
                  label="Last rejoin"
                  value={worker.lastRejoinDate ? formatDate(worker.lastRejoinDate) : null}
                  hint="Worked out from history, not stored"
                />
              </dl>

              <Link href={routes.hr.editEmployee(worker.id)} className="btn-ghost op-hr-link">
                Open the HR record
              </Link>
            </div>
          </section>
        </aside>
      </div>

      {moveOpen ? (
        <MoveDialog
          workers={[worker]}
          onClose={() => setMoveOpen(false)}
          onMoved={() => setMoveOpen(false)}
        />
      ) : null}

      <ConfirmDialog
        open={undoOpen}
        title="Undo the last move?"
        confirmLabel="Undo move"
        isPending={undo.isPending}
        onClose={() => setUndoOpen(false)}
        onConfirm={() =>
          undo.mutate(worker.id, { onSettled: () => setUndoOpen(false) })
        }
      >
        <p>
          {previous
            ? `${worker.name} returns to ${placementLabel(previous)}, and his current placement at ${placementLabel(worker.current)} is deleted.`
            : `${worker.name} goes back to awaiting placement — this was his first placement, so there is nothing to return him to.`}
        </p>
      </ConfirmDialog>
    </>
  );
}

function TimelineItem({ placement, current }: { placement: Placement; current: boolean }) {
  return (
    <li className="timeline-item" data-current={current}>
      <h4>
        <i className={`dot dot--${KIND_TONE[placement.kind]}`} />
        {placementLabel(placement)}
      </h4>
      <p className="dates">
        {current
          ? `since ${formatDate(placement.startDate)}`
          : placementDates(placement.startDate, placement.endDate)}
        {' · '}
        {duration(placement.startDate, placement.endDate)}
      </p>
      <p className="meta">
        {placement.accommodation
          ? `${ACCOMMODATION_LABELS[placement.accommodation] ?? placement.accommodation}${
              placement.accommodationNote ? ` (${placement.accommodationNote})` : ''
            }`
          : null}
        {placement.remark ? `${placement.accommodation ? ' · ' : ''}${placement.remark}` : null}
        {placement.createdBy ? (
          <span className="op-recorded"> Recorded by {placement.createdBy.fullName}</span>
        ) : null}
      </p>
    </li>
  );
}

function Fact({
  label,
  value,
  mono,
  hint,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <div className="op-fact">
      <dt>
        {label}
        {hint ? <span className="op-fact-hint">{hint}</span> : null}
      </dt>
      <dd className={mono ? 'mono' : undefined}>{value || EM_DASH}</dd>
    </div>
  );
}
