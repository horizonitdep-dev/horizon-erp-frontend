'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ACCESS } from '@/core/config/access';
import { routes } from '@/core/config/routes';
import { apiMessage } from '@/core/api/unwrap';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AlertIcon, ChevronDownIcon } from '@/components/ui/icons';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states';
import { formatDate } from '@/lib/format';
import { AccessGate } from '@/features/auth/components/access-gate';
import { useReinstateEmployee } from '@/features/employees/hooks/use-employee-mutations';
import { useEmployeeDeparture } from '../hooks/use-departures';
import type { Departure } from '../types';
import { ApprovalsPanel } from './approvals-panel';
import { ClearancePanel } from './clearance-panel';
import { StageStatus } from './departure-stage';
import { HrSectionPanel } from './hr-section-panel';

/**
 * The Employee Departure Form — three panels matching the paper form's three
 * blocks, in order. Keyed by employee: it shows that employee's most recent
 * departure, voided or not.
 */
export function DepartureRecord({ employeeId }: { employeeId: string }) {
  const { departure, notFound, isPending, isError, error, refetch } = useEmployeeDeparture(employeeId);

  if (isPending) {
    return (
      <>
        <div className="hirs-head">
          <Skeleton className="head-skeleton" />
        </div>
        <div className="panel">
          <div className="panel-skeleton">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="panel-skeleton-row" />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (notFound) {
    return (
      <div className="panel">
        <EmptyState
          title="No departure record"
          message="This employee has never been cancelled. Cancel them from their employee record to open a departure form."
          action={
            <Link href={routes.hr.editEmployee(employeeId)} className="btn-ghost">
              Open employee record
            </Link>
          }
        />
      </div>
    );
  }

  if (isError || !departure) {
    return (
      <div className="panel">
        <ErrorState
          message={apiMessage(error, 'The departure record could not be loaded.')}
          action={
            <>
              <Link href={routes.hr.cancelledEmployees} className="btn-ghost">
                Back to cancelled employees
              </Link>
              <Button variant="ghost" onClick={() => refetch()}>
                Try again
              </Button>
            </>
          }
        />
      </div>
    );
  }

  // Voided records are evidence; approved content is signed off. Neither is edited.
  const frozen = !!departure.voidedAt || !!departure.hrApprovedAt || !!departure.mdApprovedAt;

  return (
    <>
      <nav className="ef-crumb an" aria-label="Breadcrumb">
        <Link href={routes.hr.employees}>HR</Link>
        <ChevronDownIcon size={13} className="crumb-chevron" />
        <Link href={routes.hr.cancelledEmployees}>Cancelled employees</Link>
        <ChevronDownIcon size={13} className="crumb-chevron" />
        <span>{departure.referenceNo}</span>
      </nav>

      <div className="hirs-head an">
        <div>
          <h1 className="t-h1">{departure.employee.name}</h1>
          <p className="lede">
            Employee departure form · <span className="mono">{departure.referenceNo}</span> · dated{' '}
            {formatDate(departure.formDate)}
          </p>
          <p className="ef-docref">
            Mirrors the paper Employee Departure Form · document code to be confirmed with HR
          </p>
        </div>
        {!departure.voidedAt && departure.employee.employmentStatus === 'CANCELLED' ? (
          <AccessGate rule={ACCESS.employeeReinstate}>
            <div className="head-actions">
              <ReinstateAction departure={departure} />
            </div>
          </AccessGate>
        ) : null}
      </div>

      <StageBanner departure={departure} />

      {/* Keyed so a different record remounts the forms with its own values. */}
      <div className="ef-stack" key={departure.id}>
        <HrSectionPanel departure={departure} frozen={frozen} />
        {/* The clearance panel locks itself by stage — Operations own it. */}
        <ClearancePanel departure={departure} />
        <ApprovalsPanel departure={departure} />
      </div>
    </>
  );
}

/**
 * The one piece of UI that makes a multi-party workflow legible: where the
 * record is, and what is needed to move it on.
 */
function StageBanner({ departure }: { departure: Departure }) {
  return (
    <section className="dp-banner an" data-stage={departure.stage} aria-live="polite">
      <div className="dp-banner-stage">
        <span className="dp-banner-label">Stage</span>
        <StageStatus stage={departure.stage} />
      </div>
      <div className="dp-banner-text">
        <p>{departure.nextStep}</p>
        {departure.warnings.map((warning) => (
          <p key={warning} className="dp-warn">
            <AlertIcon size={14} />
            {warning}
          </p>
        ))}
      </div>
    </section>
  );
}

function ReinstateAction({ departure }: { departure: Departure }) {
  const [open, setOpen] = useState(false);
  const reinstate = useReinstateEmployee();
  const { employee } = departure;

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Reinstate employee
      </Button>
      <ConfirmDialog
        open={open}
        title={`Reinstate ${employee.name}?`}
        confirmLabel="Reinstate"
        isPending={reinstate.isPending}
        onClose={() => setOpen(false)}
        onConfirm={() =>
          reinstate.mutate(
            { id: employee.id, name: employee.name },
            { onSettled: () => setOpen(false) },
          )
        }
      >
        <p>
          {employee.name} returns to Current employees. Departure {departure.referenceNo} is voided
          and kept as a record — it is not deleted, and it cannot be edited afterwards.
        </p>
      </ConfirmDialog>
    </>
  );
}
