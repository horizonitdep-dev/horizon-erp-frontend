'use client';

import { approvalSlot } from '@/core/config/access';
import { CheckIcon } from '@/components/ui/icons';
import { formatDate } from '@/lib/format';
import { useSession } from '@/features/auth/hooks/use-session';
import { useApproveDeparture } from '../hooks/use-departures';
import type { Actor, Departure } from '../types';

/**
 * Panel 3 — the two signature boxes at the foot of the form, side by side. Both
 * open only once the Operations Manager has approved the clearance section. The
 * server picks the slot from the caller's department and level — an HR & Admin
 * head signs HR Manager, an executive signs Managing Director — and each card
 * only offers the button to someone who can fill it.
 */
export function ApprovalsPanel({ departure }: { departure: Departure }) {
  const approve = useApproveDeparture(departure.id);
  const { user } = useSession();
  const slot = approvalSlot(user);
  const isHr = slot === 'HR';
  const isMd = slot === 'MD';

  const voided = !!departure.voidedAt;
  const notReady = !departure.clearanceApprovedAt;

  const blockedReason = voided
    ? 'Voided — no approval needed.'
    : notReady
      ? 'Available once the Operations Manager has approved airport clearance.'
      : null;

  return (
    <section className="panel an" aria-labelledby="dp-part3">
      <header className="ef-phead">
        <span className="ef-pnum">Part 3</span>
        <div>
          <h2 id="dp-part3">Approvals</h2>
          <p className="note">Signed in order: HR Manager, then Managing Director.</p>
        </div>
      </header>

      <div className="ef-pbody">
        <div className="dp-approvals">
          <ApprovalCard
            title="HR Manager"
            at={departure.hrApprovedAt}
            by={departure.hrApprovedBy}
            canApprove={isHr}
            disabledReason={blockedReason}
            awaitingText="Awaiting the HR Manager."
            isPending={approve.isPending}
            onApprove={() => approve.mutate()}
          />
          <ApprovalCard
            title="Managing Director"
            at={departure.mdApprovedAt}
            by={departure.mdApprovedBy}
            canApprove={isMd}
            disabledReason={
              blockedReason ??
              (departure.hrApprovedAt ? null : 'Available once the HR Manager has approved.')
            }
            awaitingText={
              departure.hrApprovedAt
                ? 'Awaiting the Managing Director.'
                : 'Awaiting the HR Manager first.'
            }
            isPending={approve.isPending}
            onApprove={() => approve.mutate()}
          />
        </div>
      </div>
    </section>
  );
}

function ApprovalCard({
  title,
  at,
  by,
  canApprove,
  disabledReason,
  awaitingText,
  isPending,
  onApprove,
}: {
  title: string;
  at: string | null;
  by: Actor | null;
  canApprove: boolean;
  disabledReason: string | null;
  awaitingText: string;
  isPending: boolean;
  onApprove: () => void;
}) {
  if (at) {
    return (
      <article className="dp-approval" data-done="true">
        <h3>{title}</h3>
        <p className="dp-approval-by">
          <CheckIcon size={15} />
          {by?.fullName ?? 'Approved'}
        </p>
        <p className="dp-approval-at">{formatDate(at)}</p>
      </article>
    );
  }

  return (
    <article className="dp-approval">
      <h3>{title}</h3>
      {canApprove ? (
        <>
          <button
            type="button"
            className="btn-primary"
            disabled={!!disabledReason || isPending}
            onClick={onApprove}
          >
            {isPending ? 'Recording…' : `Approve as ${title}`}
          </button>
          {disabledReason ? <p className="dp-approval-reason">{disabledReason}</p> : null}
        </>
      ) : (
        <p className="dp-approval-reason">{disabledReason ?? awaitingText}</p>
      )}
    </article>
  );
}
