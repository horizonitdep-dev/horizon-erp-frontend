'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * A modal dialog, rendered through a portal to <body>.
 *
 * The portal is not optional. `.hirs-wrap` sets `z-index: 2`, which makes it a
 * stacking context, so a dialog rendered inside the page can never rise above
 * the shell bars at `z-index: 4` no matter how high its own z-index goes — its
 * header ends up painted under the module tabs. Escaping to <body> puts the
 * backdrop in the root stacking context, where its z-index means what it says.
 */
export function Dialog({
  title,
  onClose,
  children,
  labelledBy,
}: {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Id of the heading inside `children`, when the caller renders its own. */
  labelledBy?: string;
}) {
  // Escape closes, and the page behind must not scroll while this is open.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="op-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="op-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
