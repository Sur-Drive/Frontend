export const PAGE_SIZE = 10;

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

const NAV_BUTTON =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50";

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <div className="mt-5 flex min-w-0 flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-ink-muted">
        {total === 0 ? "No results" : `Showing ${from}–${to} of ${total}`}
      </p>
      <nav className="flex min-w-0 flex-wrap items-center gap-1.5" aria-label="Pagination">
        <button
          type="button"
          className={NAV_BUTTON}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        {pages.map((item) => (
          <button
            key={item}
            type="button"
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPageChange(item)}
            className={
              item === page
                ? "inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-brand px-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                : NAV_BUTTON
            }
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          className={NAV_BUTTON}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
        >
          Next
        </button>
      </nav>
    </div>
  );
}
