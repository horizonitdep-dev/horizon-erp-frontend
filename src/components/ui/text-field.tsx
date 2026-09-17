'use client';

import { forwardRef, useId, useState } from 'react';
import { cn } from '@/lib/cn';
import { AlertIcon, EyeIcon, EyeOffIcon } from './icons';

/**
 * A labelled input with its trailing icon and error line — DESIGN.md §7 FORM.
 * Errors render in `.field-error` below the field, which is where both Zod's
 * message and the envelope's message go.
 */

export type TextFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  error?: string | undefined;
  /** Trailing icon inside the field. Omitted for a password field, which owns its own. */
  icon?: React.ReactNode;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, icon, className, ...props },
  ref,
) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={cn('field', className)}>
      <label htmlFor={id}>{label}</label>
      <div className="input-shell">
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        {icon ? <span className="input-icon">{icon}</span> : null}
      </div>
      {error ? (
        <p className="field-error" id={errorId} role="alert">
          <AlertIcon size={14} />
          {error}
        </p>
      ) : null}
    </div>
  );
});

/** Same field, with a show/hide toggle in the icon slot. */
export const PasswordField = forwardRef<HTMLInputElement, Omit<TextFieldProps, 'icon' | 'type'>>(
  function PasswordField({ label, error, className, ...props }, ref) {
    const id = useId();
    const errorId = `${id}-error`;
    const [visible, setVisible] = useState(false);

    return (
      <div className={cn('field', className)}>
        <label htmlFor={id}>{label}</label>
        <div className="input-shell">
          <input
            ref={ref}
            id={id}
            type={visible ? 'text' : 'password'}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            {...props}
          />
          <button
            type="button"
            className="input-icon input-icon-btn"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {error ? (
          <p className="field-error" id={errorId} role="alert">
            <AlertIcon size={14} />
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
