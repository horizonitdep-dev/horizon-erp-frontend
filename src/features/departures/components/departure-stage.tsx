import { formatDate } from '@/lib/format';
import { STAGE_LABELS, type ApprovalTick, type DepartureStage } from '../types';

/**
 * Stage and approval markers — guide §7. Stage is derived by the server; this
 * only picks the dot.
 */

const STAGE_DOT: Record<DepartureStage, string> = {
  COMPLETED: 'good',
  AWAITING_APPROVAL: 'warn',
  AWAITING_DEPARTURE: 'warn',
  DRAFT: 'neutral',
  VOIDED: 'muted',
};

export function StageStatus({ stage }: { stage: DepartureStage }) {
  return (
    <span className="status" data-stage={stage}>
      <i className={`dot dot--${STAGE_DOT[stage]}`} />
      {STAGE_LABELS[stage]}
    </span>
  );
}

/**
 * Two ticks, HR then MD, filled or hollow — so someone can scan the column for
 * what is stuck. The label carries the detail for screen readers and on hover.
 */
export function ApprovalTicks({ hr, md }: { hr: ApprovalTick | null; md: ApprovalTick | null }) {
  return (
    <span className="approval-ticks">
      <Tick slot="HR" title="HR Manager" tick={hr} />
      <Tick slot="MD" title="Managing Director" tick={md} />
    </span>
  );
}

function Tick({ slot, title, tick }: { slot: string; title: string; tick: ApprovalTick | null }) {
  const label = tick
    ? `${title} approved${tick.by ? ` by ${tick.by}` : ''} on ${formatDate(tick.at)}`
    : `${title} approval outstanding`;

  return (
    <span className="approval-tick" data-done={!!tick} title={label} aria-label={label} role="img">
      {tick ? (
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 6.2 5 8.6l4.5-5" />
        </svg>
      ) : null}
      <span aria-hidden="true">{slot}</span>
    </span>
  );
}
