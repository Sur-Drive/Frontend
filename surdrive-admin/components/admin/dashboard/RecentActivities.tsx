'use client';

import { useEffect, useState } from 'react';
import { SearchIcon } from '@/components/ui/icons/SearchIcon';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ActiveFilterIndicator } from '@/components/ui/ActiveFilterIndicator';
import { FilterPopover } from '@/components/ui/FilterPopover';
import { useTableFilters } from '@/lib/useTableFilters';
import type { DashboardActivity } from '@/types';

const STATUS_STYLES = {
  SUCCESS: 'bg-status-success-bg text-status-success-text',
  FAILED: 'bg-status-danger-bg text-status-danger-text',
  PENDING: 'bg-status-warning-bg text-status-warning-text',
};
const NEUTRAL_STYLES = 'bg-status-neutral-bg text-status-neutral-text';

function normalizeStatus(status: string): string {
  const upper = status.toUpperCase();
  if (upper === 'SUCCESS') return 'SUCCESS';
  if (upper === 'FAILED' || upper === 'FAILURE') return 'FAILED';
  if (upper === 'PENDING') return 'PENDING';
  return upper;
}

function getStatusStyles(status: string): string {
  const upper = normalizeStatus(status);
  return STATUS_STYLES[upper as keyof typeof STATUS_STYLES] ?? NEUTRAL_STYLES;
}

/** Anchor id for this section — the Topbar bell deep-links to it. */
export const RECENT_ACTIVITIES_ANCHOR = 'recent-activities';

/** Status options for the filter popover — derived from the real status values. */
const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'PENDING', label: 'Pending' },
];

export function RecentActivities({
  activities,
  initial,
}: {
  activities: DashboardActivity[];
  initial?: { search?: string; status?: string };
}) {
  const {
    filters: filterValues,
    activeCount,
    setFilter,
    setSearch,
    clearAll,
  } = useTableFilters({
    presets: [
      {
        param: 'status',
        label: 'Status',
        defaultValue: 'all',
        options: ['all', 'SUCCESS', 'FAILED', 'PENDING'],
      },
    ],
    search: { param: 'search', debounceMs: 300 },
    initial,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  // A #recent-activities deep link (bell click from another page, or a reload)
  // has nothing to scroll to natively, because this section only mounts once the
  // dashboard's analytics GET resolves. Scroll here instead, on mount.
  useEffect(() => {
    if (window.location.hash !== `#${RECENT_ACTIVITIES_ANCHOR}`) return;
    document
      .getElementById(RECENT_ACTIVITIES_ANCHOR)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const filtered = activities.filter(
    (a) =>
      (filterValues.status === 'all' || normalizeStatus(a.status) === filterValues.status) &&
      `${a.action} ${a.description} ${a.actor.name} ${a.actor.role}`
        .toLowerCase()
        .includes((filterValues.search ?? '').toLowerCase()),
  );
  return (
    <div id={RECENT_ACTIVITIES_ANCHOR} className="rounded-2xl border border-line-card bg-surface-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink-primary">Recent Activities</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-line-pill px-3.5 py-1.5">
            <SearchIcon className="h-4 w-4 text-ink-placeholder" />
            <input type="search" value={filterValues.search} onChange={(e) => setSearch(e.target.value)} placeholder="Search"
              className="w-36 bg-transparent text-sm text-ink-primary outline-none placeholder:text-ink-placeholder" />
          </div>
          <FilterPopover
            open={filtersOpen}
            onToggle={() => setFiltersOpen((value) => !value)}
            onClose={() => setFiltersOpen(false)}
            statusOptions={STATUS_OPTIONS}
            activeStatus={filterValues.status}
            onStatusChange={(value) => setFilter('status', value)}
            showDateRange={false}
            onDateChange={() => undefined}
            onClearAll={clearAll}
          />
          {activeCount > 0 && (
            <ActiveFilterIndicator count={activeCount} onClearAll={clearAll} />
          )}
        </div>
      </div>
      <div className="mt-5 hidden overflow-x-auto rounded-xl border border-line-card lg:block">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-line-card bg-[#FAFAFC] text-xs text-ink-tertiary">
              {['Activity','User','Role','Action','Timestamp','Status'].map((c) => <th key={c} className="px-4 py-3 font-medium">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((a) => (
              <tr key={a.id} className="border-b border-line-divider last:border-b-0">
                <td className="px-4 py-3.5 text-ink-primary">{a.action}</td>
                <td className="px-4 py-3.5">
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF0F4] text-[10px] font-semibold text-ink-secondary">{a.actor.initials}</span>
                    <span className="text-ink-secondary">{a.actor.name}</span>
                  </span>
                </td>
                <td className="px-4 py-3.5 text-ink-secondary">{a.actor.role}</td>
                <td className="px-4 py-3.5 text-ink-secondary">{a.description}</td>
                <td className="px-4 py-3.5 text-ink-secondary">{a.timeAgo}</td>
                <td className="px-4 py-3.5">
                  <StatusBadge label={normalizeStatus(a.status)} className={getStatusStyles(a.status)} />
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center px-6 py-14">
                    {activeCount > 0 ? (
                      <>
                        <p className="mt-5 text-sm font-semibold text-ink-secondary">No results match your filters</p>
                        <p className="mt-1 text-sm text-ink-placeholder">Try adjusting your search or status filter.</p>
                        <button
                          type="button"
                          onClick={clearAll}
                          className="mt-4 rounded-full bg-brand-primary px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-primary-hover"
                        >
                          Clear filters
                        </button>
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 120 100" className="h-24 w-28 text-[#E5E7EB]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="30" y="14" width="44" height="56" rx="5" />
                          <path d="M40 28h24M40 38h24M40 48h14" />
                          <path d="M18 82h84l-6-14H24l-6 14Z" />
                        </svg>
                        <p className="mt-5 text-sm font-semibold text-ink-secondary">No Activity Yet</p>
                        <p className="mt-1 text-sm text-ink-placeholder">All actions and system events will appear here once activity is recorded.</p>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: compact activity list (read-only, no actions/detail navigation) */}
      <ul className="mt-5 flex flex-col gap-3 lg:hidden">
        {filtered.length > 0 ? (
          filtered.map((a) => <ActivityCard key={a.id} activity={a} />)
        ) : (
          <li className="rounded-xl border border-dashed border-line-pill px-4 py-10 text-center text-sm text-ink-tertiary">
            {activeCount > 0 ? (
              <>
                No results match your filters.{' '}
                <button
                  type="button"
                  onClick={clearAll}
                  className="font-medium text-brand-primary underline underline-offset-2"
                >
                  Clear filters
                </button>
              </>
            ) : (
              'All actions and system events will appear here once activity is recorded.'
            )}
          </li>
        )}
      </ul>
    </div>
  );
}

function ActivityCard({ activity: a }: { activity: DashboardActivity }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-line-card bg-surface-card p-4">
      {/* Header: icon + description + status */}
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF0F4] text-[10px] font-semibold text-ink-secondary">
          {a.actor.initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink-primary">{a.action}</span>
          <span className="block truncate text-xs text-ink-placeholder">{a.description}</span>
        </span>
        <StatusBadge label={normalizeStatus(a.status)} className={getStatusStyles(a.status)} />
      </div>

      {/* Subtext: actor + time */}
      <div className="flex items-center gap-2 border-t border-line-divider pt-3">
        <span className="text-xs text-ink-tertiary">
          {a.actor.name} · {a.actor.role}
        </span>
        <span className="ml-auto text-xs text-ink-placeholder">{a.timeAgo}</span>
      </div>
    </li>
  );
}
