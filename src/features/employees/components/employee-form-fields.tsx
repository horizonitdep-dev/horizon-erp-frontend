'use client';

import { forwardRef, useId } from 'react';
import type { FieldError } from 'react-hook-form';
import { AlertIcon } from '@/components/ui/icons';

/**
 * Field primitives for the employee form — transcribed from
 * design/hirs-add-employee.html. Label, required marker, control, error line.
 *
 * Three shells rather than one generic: a text input, a select and a textarea
 * differ by one element, and the indirection to merge them costs more than it
 * saves.
 */

type Base = {
  label: string;
  error?: FieldError | undefined;
  required?: boolean;
  /** Rendered after the label in sentence case, e.g. "if applicable". */
  optionalNote?: string;
  hint?: React.ReactNode;
  className?: string;
};

function Label({
  htmlFor,
  label,
  required,
  optionalNote,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
  optionalNote?: string;
}) {
  return (
    <label htmlFor={htmlFor}>
      {label}
      {required ? (
        <span className="ef-req" aria-hidden="true">
          *
        </span>
      ) : null}
      {optionalNote ? <span className="ef-opt">{optionalNote}</span> : null}
    </label>
  );
}

function ErrorLine({ id, error }: { id: string; error?: FieldError | undefined }) {
  if (!error?.message) return null;
  return (
    <p className="field-error" id={id} role="alert">
      <AlertIcon size={14} />
      {error.message}
    </p>
  );
}

export const EfInput = forwardRef<
  HTMLInputElement,
  Base & React.InputHTMLAttributes<HTMLInputElement>
>(function EfInput({ label, error, required, optionalNote, hint, className, ...props }, ref) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={`ef-field ${className ?? ''}`.trim()}>
      <Label htmlFor={id} label={label} required={required} optionalNote={optionalNote} />
      <div className="ef-shell">
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
      </div>
      {hint ? <p className="ef-hint">{hint}</p> : null}
      <ErrorLine id={errorId} error={error} />
    </div>
  );
});

export const EfSelect = forwardRef<
  HTMLSelectElement,
  Base & React.SelectHTMLAttributes<HTMLSelectElement> & { placeholder?: string }
>(function EfSelect(
  { label, error, required, optionalNote, hint, className, placeholder, children, value, ...props },
  ref,
) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={`ef-field ${className ?? ''}`.trim()}>
      <Label htmlFor={id} label={label} required={required} optionalNote={optionalNote} />
      <div className="ef-shell">
        <select
          ref={ref}
          id={id}
          value={value}
          // The placeholder option is greyed until something real is chosen.
          className={!value ? 'ph' : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {children}
        </select>
      </div>
      {hint ? <p className="ef-hint">{hint}</p> : null}
      <ErrorLine id={errorId} error={error} />
    </div>
  );
});

export const EfTextarea = forwardRef<
  HTMLTextAreaElement,
  Base & React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function EfTextarea({ label, error, required, optionalNote, hint, className, ...props }, ref) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={`ef-field ${className ?? ''}`.trim()}>
      <Label htmlFor={id} label={label} required={required} optionalNote={optionalNote} />
      <div className="ef-shell">
        <textarea
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
      </div>
      {hint ? <p className="ef-hint">{hint}</p> : null}
      <ErrorLine id={errorId} error={error} />
    </div>
  );
});

/**
 * Radio pills. A fieldset rather than a div so the group has one accessible
 * name, and real radios underneath so keyboard and screen readers work.
 */
export function EfChoice<T extends string>({
  label,
  required,
  options,
  labels,
  error,
  className,
  children,
  ...radio
}: {
  label: string;
  required?: boolean;
  options: readonly T[];
  labels: Record<T, string>;
  error?: FieldError | undefined;
  className?: string;
  /** The "Other" free-text input, when the choice allows one. */
  children?: React.ReactNode;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'>) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <fieldset className={`ef-field ${className ?? ''}`.trim()}>
      <legend>
        {label}
        {required ? (
          <span className="ef-req" aria-hidden="true">
            *
          </span>
        ) : null}
      </legend>
      <div className="ef-seg">
        {options.map((option) => (
          <label key={option}>
            <input type="radio" value={option} {...radio} />
            {labels[option]}
          </label>
        ))}
        {children}
      </div>
      <ErrorLine id={errorId} error={error} />
    </fieldset>
  );
}
