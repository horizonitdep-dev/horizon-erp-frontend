'use client';

import { formatCount } from '@/lib/format';

/**
 * Server-side pagination — DESIGN.md §7. `‹ 1 2 3 ›`, current page on the
 * gradient, a plain range summary on the left.
 *
 * Lives here rather than in a feature because HR, Departures and Operations
 * all use it.
 */
export function Pagination({
  page,
  totalPages,
  total,
  limit,
  /** What is being counted, e.g. "worker". Pluralised with a trailing s. */
  noun = 'result',
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  noun?: string;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav className="pagination" aria-label="Pagination">
      <span>
        {formatCount(from)}–{formatCount(to)} of {formatCount(total)}{' '}
        {total === 1 ? noun : `${noun}s`}
      </span>
      <div className="pagination-pages">
        <button
          type="button"
          className="page-btn"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          ‹
        </button>
        {pageWindow(page, totalPages).map((p) => (
          <button
            key={p}
            type="button"
            className="page-btn"
            data-active={p === page}
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onPage(p)}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="page-btn"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </nav>
  );
}

/** At most five page buttons, centred on the current page. */
function pageWindow(page: number, totalPages: number): number[] {
  const span = Math.min(5, totalPages);
  let start = Math.max(1, page - Math.floor(span / 2));
  if (start + span - 1 > totalPages) start = totalPages - span + 1;
  return Array.from({ length: span }, (_, i) => start + i);
}
