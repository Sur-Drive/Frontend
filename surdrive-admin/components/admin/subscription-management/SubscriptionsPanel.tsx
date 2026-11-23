'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchIcon } from '@/components/ui/icons/SearchIcon';
import { ChevronLeftIcon } from '@/components/ui/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '@/components/ui/icons/ChevronRightIcon';
import { SubscriptionActionsMenu } from './SubscriptionActionsMenu';
import { SubscriptionStatTiles } from './SubscriptionStatTiles';
import { ExtendSubscriptionModal } from './ExtendSubscriptionModal';
import { CancelSubscriptionModal } from './CancelSubscriptionModal';
import { Toast } from '@/components/ui/Toast';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ActiveFilterIndicator, FilterEmptyState } from '@/components/ui/ActiveFilterIndicator';
import { getSubscriptions } from '@/lib/subscriptions';
import { useTableFilters } from '@/lib/useTableFilters';
import { formatDate, formatNaira } from '@/lib/formatters';
import type { Subscription, SubscriptionStats, SubscriptionsPagination } from '@/types';

// Reused from Fleet Management (FleetsPanel.tsx).
const PLAN_LABEL: Record<string, string> = {
  pro: 'Pro Fleet',
  starter: 'Starter Fleet',
  free_trial: 'Free Trial',
  enterprise: 'Enterprise',
};

const SUBS_PER_PAGE = 10;

type TabId = 'all' | 'active' | 'free' | 'ended';

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All Subscriptions' },
  { id: 'active', label: 'Active' },
  { id: 'free', label: 'Free' },
  { id: 'ended', label: 'Cancelled/Expired' },
];

const STATUS_BADGE_STYLES: Record<string, string> = {
  active: 'bg-status-success-bg text-status-success-text',
  trial: 'bg-[#EEF2FF] text-[#6172F3]',
  expired: 'bg-status-danger-bg text-status-danger-text',
  pending: 'bg-status-warning-bg text-status-warning-text',
};

const PLAN_BADGE_STYLES: Record<string, string> = {
  'Pro Fleet': 'bg-status-success-bg text-status-success-text',
  'Starter Fleet': 'bg-[#F3EBFE] text-[#8B5CF6]',
  'Free Trial': 'bg-[#EEF2FF] text-[#6172F3]',
};

const COLUMNS = ['User', 'Organization', 'Plan', 'Vehicles', 'Renewal Date', 'Amount', 'Status', 'Actions'];

function planLabel(plan: string): string {
  return PLAN_LABEL[plan] ?? plan;
}

/** Tab logic derived from real fields (per integration spec). */
function matchesTab(subscription: Subscription, tab: TabId): boolean {
  switch (tab) {
    case 'all':
      return true;
    case 'active':
      return subscription.status === 'active' && !subscription.isTrial;
    case 'free':
      return subscription.isTrial === true;
    case 'ended':
      return subscription.isExpired === true;
  }
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
export function SubscriptionsPanel({
  initial,
}: {
  initial?: { tab?: string; search?: string; page?: string };
}) {
  const router = useRouter();
  const {
    filters: filterValues,
    page,
    debouncedSearch,
    activeCount,
    setFilter,
    setPage,
    clearAll,
  } = useTableFilters({
    presets: [
      {
        param: 'tab',
        label: 'Tab',
        defaultValue: 'all',
        options: ['all', 'active', 'free', 'ended'],
      },
    ],
    search: { param: 'search', debounceMs: 300 },
    page: { param: 'page', default: 1 },
    initial,
  });

  const tab = filterValues.tab as TabId;

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [, setPagination] = useState<SubscriptionsPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extendTarget, setExtendTarget] = useState<Subscription | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // The `active` tab is expressed to the backend as status=active (a param it
  // supports). `free` (isTrial) and `ended` (isExpired) have no backend param,
  // so they are applied client-side over the fetched pages — see the report.
  const serverStatus = tab === 'active' ? 'active' : undefined;

  // Backend can't filter by isTrial/isExpired, so fetch all pages and
  // apply tab/search/pagination client-side (same shape as the original mock).
  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const first = await getSubscriptions({
        search: debouncedSearch || undefined,
        page: 1,
        limit: 100,
        status: serverStatus,
      });
      let all = [...first.subscriptions];
      for (let p = 2; p <= first.pagination.totalPages; p++) {
        const next = await getSubscriptions({
          search: debouncedSearch || undefined,
          page: p,
          limit: 100,
          status: serverStatus,
        });
        all = all.concat(next.subscriptions);
      }
      setSubscriptions(all);
      setStats(first.stats);
      setPagination(first.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, serverStatus]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const filtered = useMemo(
    () => subscriptions.filter((s) => matchesTab(s, tab)),
    [subscriptions, tab],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / SUBS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageSubscriptions = filtered.slice(
    (safePage - 1) * SUBS_PER_PAGE,
    safePage * SUBS_PER_PAGE,
  );
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * SUBS_PER_PAGE + 1;
  const rangeEnd = Math.min(safePage * SUBS_PER_PAGE, filtered.length);

  const handleViewDetails = (subscription: Subscription) => {
    router.push(`/admin/subscription-management/${subscription.id}`);
  };

  const handleExtend = () => {
    // TODO: replace with real API call (subscription renewal/extend)
    setExtendTarget(null);
    setToastMessage('Renewal date successfully extended.');
  };

  const handleCancelConfirm = () => {
    if (!cancelTarget) return;
    // TODO: replace with real API call (subscription cancellation)
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === cancelTarget.id ? { ...s, isExpired: true, status: 'expired' } : s,
      ),
    );
    setCancelTarget(null);
    setToastMessage('Subscription successfully cancelled.');
  };

  return (
    <div className="flex flex-col gap-6">
      <SubscriptionStatTiles stats={stats} />

      <div className="rounded-2xl border border-line-card bg-surface-card">
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-line-card px-5 pb-px pt-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter('tab', t.id)}
              className={`relative shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t.id ? 'text-brand-primary' : 'text-ink-tertiary hover:text-ink-primary'
              }`}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line-card px-5 py-4">
          <div className="relative w-full max-w-xs">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-placeholder" />
            <input
              type="search"
              value={filterValues.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Search subscriptions..."
              className="w-full rounded-lg border border-line-pill bg-surface-subtle py-2.5 pl-9 pr-3 text-sm text-ink-primary outline-none transition-colors placeholder:text-ink-placeholder focus:border-brand-primary focus:bg-surface-card"
            />
          </div>
          {activeCount > 0 && (
            <ActiveFilterIndicator count={activeCount} onClearAll={clearAll} />
          )}
        </div>
        {/* Table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-line-card bg-surface-subtle text-xs font-medium uppercase tracking-wide text-ink-tertiary">
                {COLUMNS.map((col) => (
                  <th key={col} className="px-4 py-3">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-ink-tertiary">
                    Loading subscriptions...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-status-danger-text">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && pageSubscriptions.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-12 text-center">
                    <FilterEmptyState
                      filtersActive={activeCount > 0}
                      onClearFilters={clearAll}
                      empty={<p className="text-sm text-ink-tertiary">No subscriptions found.</p>}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                pageSubscriptions.map((subscription) => (
                  <SubscriptionRow
                    key={subscription.id}
                    subscription={subscription}
                    onViewDetails={handleViewDetails}
                    onExtend={() => setExtendTarget(subscription)}
                    onCancel={() => setCancelTarget(subscription)}
                  />
                ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: stacked cards (tap card to open subscription detail, "..." menu for actions) */}
        <ul className="mt-5 flex flex-col gap-3 lg:hidden">
          {loading && (
            <li className="rounded-xl border border-line-card px-4 py-10 text-center text-sm text-ink-tertiary">
              Loading subscriptions...
            </li>
          )}
          {!loading && error && (
            <li className="rounded-xl border border-line-card px-4 py-10 text-center text-sm text-status-danger-text">
              {error}
            </li>
          )}
          {!loading && !error && pageSubscriptions.length === 0 && (
            <li className="px-4 py-10">
              <FilterEmptyState
                filtersActive={activeCount > 0}
                onClearFilters={clearAll}
                empty={<p className="text-sm text-ink-tertiary">No subscriptions found.</p>}
              />
            </li>
          )}
          {!loading &&
            !error &&
            pageSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                onViewDetails={handleViewDetails}
                onExtend={() => setExtendTarget(subscription)}
                onCancel={() => setCancelTarget(subscription)}
              />
            ))}
        </ul>

        {/* Pagination */}
        {!loading && !error && (
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            total={filtered.length}
            onPageChange={setPage}
          />
        )}
      </div>

      {extendTarget && (
        <ExtendSubscriptionModal
          subscription={extendTarget}
          onClose={() => setExtendTarget(null)}
          onConfirm={handleExtend}
        />
      )}

      {cancelTarget && (
        <CancelSubscriptionModal
          subscription={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelConfirm}
        />
      )}

      {toastMessage && (
        <Toast
          open={!!toastMessage}
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
function Pagination({
  currentPage,
  totalPages,
  rangeStart,
  rangeEnd,
  total,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line-card px-5 py-4">
      <p className="text-sm text-ink-tertiary">
        Showing {rangeStart}&ndash;{rangeEnd} of {total} subscriptions
      </p>
      <div className="flex items-center gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line-pill text-ink-secondary transition-colors hover:border-line-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            aria-current={pageNumber === currentPage ? 'page' : undefined}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              pageNumber === currentPage
                ? 'bg-brand-primary text-white'
                : 'border border-line-pill text-ink-secondary hover:border-line-hover'
            }`}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line-pill text-ink-secondary transition-colors hover:border-line-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SubscriptionRow({
  subscription,
  onViewDetails,
  onExtend,
  onCancel,
}: {
  subscription: Subscription;
  onViewDetails: (subscription: Subscription) => void;
  onExtend: (subscription: Subscription) => void;
  onCancel: (subscription: Subscription) => void;
}) {
  return (
    <tr className="border-b border-line-divider last:border-b-0">
      <td className="px-4 py-3.5">
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white">
            {subscription.user.initials}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-ink-primary">{subscription.user.fullName}</span>
            <span className="truncate text-xs text-ink-placeholder">{subscription.user.email}</span>
          </span>
        </span>
      </td>
      <td className="px-4 py-3.5 text-ink-secondary">{subscription.organization.name}</td>
      <td className="px-4 py-3.5">
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium ${
            PLAN_BADGE_STYLES[planLabel(subscription.plan)] ?? 'bg-status-neutral-bg text-status-neutral-text'
          }`}
        >
          {planLabel(subscription.plan)}
        </span>
      </td>
      <td className="px-4 py-3.5 text-ink-secondary">{subscription.vehicleCount}</td>
      <td className="px-4 py-3.5 text-ink-secondary">{formatDate(subscription.renewalDate)}</td>
      <td className="px-4 py-3.5 text-ink-secondary">{formatNaira(subscription.amount)}</td>
      <td className="px-4 py-3.5">
        <StatusBadge
          label={statusLabel(subscription.status)}
          className={STATUS_BADGE_STYLES[subscription.status] ?? 'bg-status-neutral-bg text-status-neutral-text'}
        />
      </td>
      <td className="px-4 py-3.5">
        <SubscriptionActionsMenu
          userName={subscription.user.fullName}
          onViewDetails={() => onViewDetails(subscription)}
          onExtend={() => onExtend(subscription)}
          onCancel={() => onCancel(subscription)}
        />
      </td>
    </tr>
  );
}

function SubscriptionCard({
  subscription,
  onViewDetails,
  onExtend,
  onCancel,
}: {
  subscription: Subscription;
  onViewDetails: (subscription: Subscription) => void;
  onExtend: (subscription: Subscription) => void;
  onCancel: (subscription: Subscription) => void;
}) {
  return (
    <li
      role="button"
      tabIndex={0}
      onClick={() => onViewDetails(subscription)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onViewDetails(subscription);
        }
      }}
      className="flex cursor-pointer flex-col gap-3 rounded-xl border border-line-card bg-surface-card p-4 transition-colors hover:border-line-hover"
    >
      {/* Header: identity + status + actions */}
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white">
          {subscription.user.initials}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-ink-primary">
            {subscription.user.fullName}
          </span>
          <span className="truncate text-xs text-ink-placeholder">
            {subscription.organization.name}
          </span>
        </span>
        <StatusBadge
          label={statusLabel(subscription.status)}
          className={STATUS_BADGE_STYLES[subscription.status] ?? 'bg-status-neutral-bg text-status-neutral-text'}
        />
        <span onClick={(event) => event.stopPropagation()}>
          <SubscriptionActionsMenu
            userName={subscription.user.fullName}
            onViewDetails={() => onViewDetails(subscription)}
            onExtend={() => onExtend(subscription)}
            onCancel={() => onCancel(subscription)}
          />
        </span>
      </div>

      {/* Key metric */}
      <div className="flex items-center gap-2 border-t border-line-divider pt-3">
        <span className="text-xs text-ink-tertiary">Amount</span>
        <span className="ml-auto text-sm font-semibold text-ink-primary">
          {formatNaira(subscription.amount)}
        </span>
      </div>
    </li>
  );
}
