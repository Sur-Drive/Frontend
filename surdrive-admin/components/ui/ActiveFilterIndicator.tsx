import type { ReactNode } from 'react';
import { FilterIcon } from '@/components/ui/icons/FilterIcon';

/**
 * Active-filter indicator: shown only when at least one filter differs from
 * its default. Renders a count plus a "Clear all" action. Reused by every
 * filtered list panel so the indicator looks identical across the admin.
 */
export function ActiveFilterIndicator({
  count,
  onClearAll,
}: {
  count: number;
  onClearAll: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-ink-secondary">
        {count} active filter{count !== 1 ? 's' : ''}
      </span>
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-medium text-brand-primary underline underline-offset-2 transition-colors hover:text-brand-primary-hover"
      >
        Clear all
      </button>
    </div>
  );
}

/**
 * Filter-aware empty state. When filters are active it shows
 * "No results match your filters" with a Clear filters action; otherwise it
 * renders the supplied `empty` fallback.
 */
export function FilterEmptyState({
  filtersActive,
  onClearFilters,
  empty,
}: {
  filtersActive: boolean;
  onClearFilters?: () => void;
  empty: ReactNode;
}) {
  if (filtersActive) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-line-card px-6 py-20 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-tint mb-3">
          <FilterIcon className="h-9 w-9 text-chip-violet-text" />
        </span>
        <h2 className="mt-0 text-lg font-semibold text-ink-primary">
          No results match your filters
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-tertiary">
          Try adjusting your search, status, or date filters.
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-6 flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }
  return <div className="text-center">{empty}</div>;
}