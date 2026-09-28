'use client';

import { Button } from '@/components/ui/button';

/**
 * Appears when rows are checked — the shared `.actionbar`, the same frosted
 * bar the Add Employee form uses, so "there is something to act on" looks the
 * same everywhere.
 *
 * It mounts only when there is a selection; the bar rises in rather than
 * sitting off-screen permanently, which keeps it out of the tab order when
 * nothing is selected.
 */
export function SelectionBar({
  count,
  onClear,
  onMove,
  disabled,
}: {
  count: number;
  onClear: () => void;
  onMove: () => void;
  disabled?: boolean;
}) {
  if (count === 0) return null;

  return (
    <div className="actionbar">
      <div className="inner">
        <span className="cnt">
          <b>{count}</b> {count === 1 ? 'worker selected' : 'workers selected'} · on this page
        </span>
        <div className="right">
          <Button variant="ghost" onClick={onClear}>
            Clear
          </Button>
          <Button onClick={onMove} disabled={disabled}>
            Move workers
          </Button>
        </div>
      </div>
    </div>
  );
}
