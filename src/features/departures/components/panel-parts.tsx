'use client';

/** Small pieces shared by the two editable panels. */

export const YES_NO = ['YES', 'NO'] as const;
export const YES_NO_LABELS = { YES: 'Yes', NO: 'No' } as const;

/**
 * Each panel saves on its own. This form is filled across days by different
 * people, and one submit for the whole record guarantees lost work.
 */
export function PanelFoot({
  canEdit,
  frozen,
  isDirty,
  isPending,
  saveLabel,
  viewOnlyReason,
}: {
  canEdit: boolean;
  frozen: boolean;
  isDirty: boolean;
  isPending: boolean;
  saveLabel: string;
  viewOnlyReason: string;
}) {
  if (frozen) {
    return (
      <div className="dp-foot">
        <span className="dp-foot-note">Locked — this record has been approved or voided.</span>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="dp-foot">
        <span className="dp-foot-note">View only. {viewOnlyReason}</span>
      </div>
    );
  }

  return (
    <div className="dp-foot">
      <span className="status">
        <i className={`dot dot--${isDirty ? 'warn' : 'good'}`} />
        {isDirty ? 'Unsaved changes' : 'Saved'}
      </span>
      <button type="submit" className="btn-primary" disabled={!isDirty || isPending}>
        {isPending ? 'Saving…' : saveLabel}
      </button>
    </div>
  );
}
