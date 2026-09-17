'use client';

import { useEffect, useId, useRef } from 'react';

/**
 * A modal confirmation on the native <dialog>. showModal() gives focus
 * trapping, Escape to close and an inert page behind it without a library.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Keep as is',
  tone = 'default',
  isPending = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** `danger` for an action that changes someone's employment. */
  tone?: 'default' | 'danger';
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby={titleId}
      // Escape and the native close both land here, so state never drifts.
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop reaches the dialog element itself.
        if (event.target === event.currentTarget && !isPending) onClose();
      }}
    >
      <div className="confirm-dialog-body">
        <h2 id={titleId}>{title}</h2>
        <div className="confirm-dialog-text">{children}</div>
        <div className="confirm-dialog-actions">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isPending}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn-primary"
            data-tone={tone}
            onClick={onConfirm}
            disabled={isPending}
            autoFocus
          >
            {isPending ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
