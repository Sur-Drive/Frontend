'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchIcon } from '@/components/ui/icons/SearchIcon';
import { FleetIcon } from '@/components/ui/icons/FleetIcon';
import { ChevronLeftIcon } from '@/components/ui/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '@/components/ui/icons/ChevronRightIcon';
import { FleetActionsMenu } from './FleetActionsMenu';
import { ConfirmActionModal, type ConfirmActionType } from '@/components/admin/user-management/ConfirmActionModal';
import { Toast } from '@/components/ui/Toast';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AlertIcon } from '@/components/ui/icons/AlertIcon';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ActiveFilterIndicator, FilterEmptyState } from '@/components/ui/ActiveFilterIndicator';
import { formatNaira } from '@/lib/formatters';
import { suspendFleet, activateFleet } from '@/lib/fleets';
import type { Fleet, FleetStatus, FleetsPagination, FleetStatusFilter } from '@/types';

// NOTE: "All Users" is the first tab label here, keeping tab wording consistent with the users page
const TABS: { id: FleetStatusFilter; label: string }[] = [
  { id: 'all', label: 'All Users' },
  { id: 'pending', label: 'Pending' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'active', label: 'Active' },
  { id: 'expired', label: 'Expired' },
];

const STATUS_BADGE_STYLES: Record<FleetStatus, string> = {
  active: 'bg-status-success-bg text-status-success-text',
  pending: 'bg-status-warning-bg text-status-warning-text',
  suspended: 'bg-status-danger-bg text-status-danger-text',
  expired: 'bg-status-neutral-bg text-ink-tertiary',
};

const STATUS_LABEL: Record<FleetStatus, string> = {
  active: 'Active',
  pending: 'Pending',
  suspended: 'Suspended',
  expired: 'Expired',
};

const PLAN_LABEL: Record<string, string> = {
  pro: 'Pro Fleet',
  starter: 'Starter Fleet',
  free_trial: 'Free Trial',
  enterprise: 'Enterprise',
};

// FleetActionsMenu still uses the legacy capitalized statuses (out of scope to
// change); translate the new lowercase statuses so the menu renders correctly.
function toLegacyStatus(status: FleetStatus): 'Active' | 'Pending' | 'Suspended' {
  switch (status) {
    case 'active':
      return 'Active';
    case 'suspended':
      return 'Suspended';
    case 'pending':
    case 'expired':
    default:
      return 'Pending';
  }
}

const COLUMNS = ['Company', 'Owner', 'Plan', 'Vehicles', 'Drivers', 'MRR', 'Status', 'Actions'];

type FleetsPanelProps = {
  /** Server-filtered + paginated list — used as-is (no client-side filtering). */
  fleets: Fleet[];
  pagination: FleetsPagination;
  loading: boolean;
  error: string | null;
  /** Active tab — controlled by FleetManagementView so it can refetch. */
  status: FleetStatusFilter;
  query: string;
  /** Number of active filters (tab != all or non-empty search). */
  activeCount: number;
  /** Clears every filter and resets page 1. */
  onClearAll: () => void;
  onFilterChange: (key: 'status' | 'search', value: string) => void;
  onPageChange: (page: number) => void;
  /** Bumped by the panel after a successful suspend/activate to trigger a refetch. */
  onFleetsChange: () => void;
};

export function FleetsPanel({
  fleets,
  pagination,
  loading,
  error,
  status,
  query,
  activeCount,
  onClearAll,
  onFilterChange,
  onPageChange,
  onFleetsChange,
}: FleetsPanelProps) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<{ action: ConfirmActionType; fleet: Fleet } | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [toast, setToast] = useState<{ open: boolean; message: string; variant?: 'success' | 'error' }>({
    open: false,
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleViewDetails = (fleet: Fleet) => {
    router.push(`/admin/fleet-management/${fleet.id}`);
  };

  const isSuspending = confirm?.action === 'fleet-suspend';
  const reasonValid = suspendReason.trim().length >= 3;

  const handleConfirm = async () => {
    if (!confirm) return;
    const { action, fleet } = confirm;
    setSubmitting(true);
    try {
      if (action === 'fleet-suspend') {
        if (!reasonValid) return;
        const res = await suspendFleet(fleet.id, suspendReason.trim());
        setToast({ open: true, message: res.message, variant: 'success' });
      } else if (action === 'fleet-reactivate') {
        await activateFleet(fleet.id);
        setToast({ open: true, message: 'Fleet reactivated successfully', variant: 'success' });
      }
      setConfirm(null);
      setSuspendReason('');
      onFleetsChange();
    } catch (err) {
      setToast({
        open: true,
        message: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setConfirm(null);
    setSuspendReason('');
  };

  const { page, limit, total, totalPages } = pagination;
  const goToPage = (next: number) => onPageChange(next);
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  return (
    <section className="rounded-2xl border border-line-card bg-surface-card p-5 sm:p-6">
      {/* Tab bar + right controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto rounded-full bg-surface-hover p-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilterChange('status', item.id)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                status === item.id
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-full border border-line-pill bg-surface-card px-3.5 py-1.5">
          <SearchIcon className="h-4 w-4 text-ink-placeholder" />
          <input
            type="search"
            value={query}
            onChange={(event) => onFilterChange('search', event.target.value)}
            placeholder="Search fleets..."
            className="w-40 bg-transparent text-sm text-ink-primary outline-none placeholder:text-ink-placeholder"
          />
        </div>
        {activeCount > 0 && (
          <ActiveFilterIndicator count={activeCount} onClearAll={onClearAll} />
        )}
      </div>

      {error ? (
        <div className="mt-5">
          <AlertBanner icon={<AlertIcon className="h-4 w-4" />}>{error}</AlertBanner>
        </div>
      ) : null}

      {/* Content: loading, empty state, or table */}
      {loading ? (
        <div className="mt-5 flex flex-col items-center rounded-xl border border-line-card px-6 py-16">
          <p className="text-sm text-ink-tertiary">Loading fleets…</p>
        </div>
      ) : fleets.length === 0 ? (
        <FilterEmptyState
          filtersActive={activeCount > 0}
          onClearFilters={onClearAll}
          empty={<EmptyState />}
        />
      ) : (
        <PopulatedView
          fleets={fleets}
          filteredCount={total}
          totalPages={totalPages}
          currentPage={page}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onPageChange={goToPage}
          onViewDetails={handleViewDetails}
          onSuspend={(fleet) => setConfirm({ action: 'fleet-suspend', fleet })}
          onReactivate={(fleet) => setConfirm({ action: 'fleet-reactivate', fleet })}
        />
      )}

      <ConfirmActionModal
        open={confirm !== null}
        action={confirm?.action ?? 'fleet-suspend'}
        userName={confirm?.fleet.companyName ?? ''}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        reason={isSuspending ? suspendReason : undefined}
        onReasonChange={isSuspending ? setSuspendReason : undefined}
        reasonPlaceholder="Why is this fleet being suspended?"
        submitting={submitting}
      />
      <Toast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast({ open: false, message: '' })}
      />
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-line-card px-6 py-20">
      {/* Placeholder truck illustration — TODO: swap for the final asset */}
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-tint">
        <FleetIcon className="h-9 w-9 text-[#8B5CF6]" />
      </span>
      <h2 className="mt-5 text-lg font-semibold text-ink-primary">No Fleet yet</h2>
      <p className="mt-2 max-w-sm text-center text-sm leading-relaxed text-ink-tertiary">
        There are no registered Fleet on the platform yet. Once users sign up,
        they&apos;ll appear here for you to manage.
      </p>
    </div>
  );
}

type PopulatedViewProps = {
  fleets: Fleet[];
  filteredCount: number;
  totalPages: number;
  currentPage: number;
  rangeStart: number;
  rangeEnd: number;
  onPageChange: (page: number) => void;
  onViewDetails: (fleet: Fleet) => void;
  onSuspend: (fleet: Fleet) => void;
  onReactivate: (fleet: Fleet) => void;
};

function PopulatedView({
  fleets,
  filteredCount,
  totalPages,
  currentPage,
  rangeStart,
  rangeEnd,
  onPageChange,
  onViewDetails,
  onSuspend,
  onReactivate,
}: PopulatedViewProps) {
  return (
    <>
      {/* Desktop: full table (unchanged) */}
      <div className="mt-5 hidden overflow-x-auto rounded-xl border border-line-card lg:block">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead>
            <tr className="border-b border-line-card bg-surface-subtle text-xs font-medium uppercase tracking-wide text-ink-tertiary">
              {COLUMNS.map((column) => (
                <th key={column} className="px-4 py-3">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fleets.map((fleet) => (
              <FleetRow
                key={fleet.id}
                fleet={fleet}
                onViewDetails={onViewDetails}
                onSuspend={onSuspend}
                onReactivate={onReactivate}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards (tap card to open fleet detail, "..." menu for actions) */}
      <ul className="mt-5 flex flex-col gap-3 lg:hidden">
        {fleets.map((fleet) => (
          <FleetCard
            key={fleet.id}
            fleet={fleet}
            onViewDetails={onViewDetails}
            onSuspend={onSuspend}
            onReactivate={onReactivate}
          />
        ))}
      </ul>

      {/* Pagination footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-tertiary">
          Showing {rangeStart}-{rangeEnd} of {filteredCount} users
        </p>
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line-pill text-ink-secondary transition-colors hover:border-line-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
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
            ),
          )}
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
    </>
  );
}

function FleetRow({
  fleet,
  onViewDetails,
  onSuspend,
  onReactivate,
}: {
  fleet: Fleet;
  onViewDetails: (fleet: Fleet) => void;
  onSuspend: (fleet: Fleet) => void;
  onReactivate: (fleet: Fleet) => void;
}) {
  const ownerInitials = fleet.owner.fullName
    .split(' ')
    .map((part) => part[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <tr className="border-b border-line-divider last:border-b-0">
      <td className="px-4 py-3.5">
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-ink-primary">{fleet.companyName}</span>
          <span className="truncate text-xs text-ink-placeholder">
            {fleet.location} · {fleet.fleetCode}
          </span>
        </span>
      </td>
      <td className="px-4 py-3.5">
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white">
            {ownerInitials}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-ink-primary">{fleet.owner.fullName}</span>
            <span className="truncate text-xs text-ink-placeholder">{fleet.owner.email}</span>
          </span>
        </span>
      </td>
      <td className="px-4 py-3.5 text-ink-secondary">{PLAN_LABEL[fleet.plan] ?? fleet.plan}</td>
      <td className="px-4 py-3.5 text-ink-secondary">{fleet.vehicleCount}</td>
      <td className="px-4 py-3.5 text-ink-secondary">{fleet.driverCount}</td>
      <td className="px-4 py-3.5 text-ink-secondary">{formatNaira(fleet.mrr)}</td>
      <td className="px-4 py-3.5">
        <StatusBadge
          label={STATUS_LABEL[fleet.status]}
          className={STATUS_BADGE_STYLES[fleet.status]}
        />
      </td>
      <td className="px-4 py-3.5">
        <FleetActionsMenu
          company={fleet.companyName}
          status={toLegacyStatus(fleet.status)}
          onViewDetails={() => onViewDetails(fleet)}
          onSuspend={() => onSuspend(fleet)}
          onReactivate={() => onReactivate(fleet)}
        />
      </td>
    </tr>
  );
}

function FleetCard({
  fleet,
  onViewDetails,
  onSuspend,
  onReactivate,
}: {
  fleet: Fleet;
  onViewDetails: (fleet: Fleet) => void;
  onSuspend: (fleet: Fleet) => void;
  onReactivate: (fleet: Fleet) => void;
}) {
  return (
    <li
      role="button"
      tabIndex={0}
      onClick={() => onViewDetails(fleet)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onViewDetails(fleet);
        }
      }}
      className="flex cursor-pointer flex-col gap-3 rounded-xl border border-line-card bg-surface-card p-4 transition-colors hover:border-line-hover"
    >
      {/* Header: company + status + actions */}
      <div className="flex items-center gap-3">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-ink-primary">{fleet.companyName}</span>
          <span className="truncate text-xs text-ink-placeholder">
            {fleet.location} · {fleet.fleetCode}
          </span>
        </span>
        <StatusBadge
          label={STATUS_LABEL[fleet.status]}
          className={STATUS_BADGE_STYLES[fleet.status]}
        />
        <span onClick={(event) => event.stopPropagation()}>
          <FleetActionsMenu
            company={fleet.companyName}
            status={toLegacyStatus(fleet.status)}
            onViewDetails={() => onViewDetails(fleet)}
            onSuspend={() => onSuspend(fleet)}
            onReactivate={() => onReactivate(fleet)}
          />
        </span>
      </div>

      {/* Key metric */}
      <div className="flex items-center gap-2 border-t border-line-divider pt-3">
        <span className="text-xs text-ink-tertiary">MRR</span>
        <span className="ml-auto text-sm font-semibold text-ink-primary">{formatNaira(fleet.mrr)}</span>
      </div>
    </li>
  );
}