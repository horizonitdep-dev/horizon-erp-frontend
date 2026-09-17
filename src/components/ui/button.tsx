import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * Thin wrapper over the button classes in DESIGN.md §7. No new geometry here —
 * the variant simply picks the class the mockups already define.
 */

type Variant = 'primary' | 'ghost' | 'submit';

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  submit: 'btn-submit',
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', className, type = 'button', ...props },
  ref,
) {
  return <button ref={ref} type={type} className={cn(VARIANT_CLASS[variant], className)} {...props} />;
});
