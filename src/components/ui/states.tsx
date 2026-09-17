import { cn } from '@/lib/cn';
import { AlertIcon, InboxIcon } from './icons';

/**
 * Loading, empty and error states. Every list needs all three (guide §6.3).
 *
 * Copy follows DESIGN.md §12: errors say what went wrong and what to do,
 * without apologising; empty states are an invitation to act, not a shrug.
 */

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={cn('skeleton', className)} style={{ display: 'block', ...style }} />;
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="state">
      <div className="state-icon">
        <InboxIcon />
      </div>
      <h4>{title}</h4>
      <p>{message}</p>
      {action ? <div className="actions">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'That did not load',
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="state" role="alert">
      <div className="state-icon">
        <AlertIcon size={20} />
      </div>
      <h4>{title}</h4>
      <p>{message}</p>
      {action ? <div className="actions">{action}</div> : null}
    </div>
  );
}

/** Placeholder rows sized to the real table, so the panel does not jump. */
export function TableSkeleton({ rows = 8, columns }: { rows?: number; columns: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} data-inert="true">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <td key={colIndex}>
              <Skeleton style={{ height: 12, width: colIndex === 0 ? '70%' : '55%' }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
