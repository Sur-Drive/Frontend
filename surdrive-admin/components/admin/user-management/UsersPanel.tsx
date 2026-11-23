'use client';

import { useState } from 'react';
import { SearchIcon } from '@/components/ui/icons/SearchIcon';
import { PlusIcon } from '@/components/ui/icons/PlusIcon';
import { UserIcon } from '@/components/ui/icons/UserIcon';
import { ChevronLeftIcon } from '@/components/ui/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '@/components/ui/icons/ChevronRightIcon';
import { InviteDriverModal } from './InviteDriverModal';
import { UserActionsMenu } from './UserActionsMenu';
import { DriverDetailsModal } from './DriverDetailsModal';
import { ConfirmActionModal, type ConfirmActionType } from './ConfirmActionModal';
import { Toast } from '@/components/ui/Toast';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AlertIcon } from '@/components/ui/icons/AlertIcon';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ActiveFilterIndicator, FilterEmptyState } from '@/components/ui/ActiveFilterIndicator';
import { suspendDriver, activateDriver } from '@/lib/drivers';
import type { Driver, DriverStatus, DriversPagination, UserStatusFilter } from '@/types';

const TABS: { id: UserStatusFilter; label: string }[] = [
  { id: 'all', label: 'All Users' },
  { id: 'pending', label: 'Pending' },
  { id: 'inactive', label: 'Suspended' },
  { id: 'active', label: 'Active' },
];

const STATUS_BADGE_STYLES: Record<DriverStatus, string> = {
  active: 'bg-status-success-bg text-status-success-text',
  pending: 'bg-status-warning-bg text-status-warning-text',
  inactive: 'bg-status-danger-bg text-status-danger-text',
  suspended: 'bg-status-danger-bg text-status-danger-text',
};

const STATUS_LABEL: Record<DriverStatus, string> = {
  active: 'Active',
  pending: 'Pending',
  inactive: 'Suspended',
  suspended: 'Suspended',
};

const COLUMNS = ['User', 'Role', 'Fleet', 'City', 'Trust Score(%)', 'Reports', 'Status', 'Actions'];

type UsersPanelProps = {
  /** Server-filtered + paginated list — used as-is (no client-side filtering). */
  drivers: Driver[];
  pagination: DriversPagination;
  loading: boolean;
  error: string | null;
  /** Active tab — controlled by UserManagementView so it can refetch. */
  status: UserStatusFilter;
  query: string;
  /** Number of active filters (tab != all or non-empty search). */
  activeCount: number;
  /** Clears every filter and resets page 1. */
  onClearAll: () => void;
  onFilterChange: (key: 'status' | 'search', value: string) => void;
  onPageChange: (page: number) => void;
  /** Bumped by the panel after a successful suspend/activate to trigger a refetch. */
  onUsersChange: () => void;
};

export function UsersPanel({
  drivers,
  pagination,
  loading,
  error,
  status,
  query,
  activeCount,
  onClearAll,
  onFilterChange,
  onPageChange,
  onUsersChange,
}: UsersPanelProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailsUser, setDetailsUser] = useState<Driver | null>(null);
  const [confirm, setConfirm] = useState<{ action: ConfirmActionType; user: Driver } | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [toast, setToast] = useState<{ open: boolean; message: string; variant?: 'success' | 'error' }>({
    open: false,
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const openInvite = () => setInviteOpen(true);

  const isSuspending = confirm?.action === 'suspend';
  const reasonValid = suspendReason.trim().length >= 3;

  const handleConfirm = async () => {
    if (!confirm) return;
    const { action, user } = confirm;
    setSubmitting(true);
    try {
      if (action === 'suspend') {
        if (!reasonValid) return;
        const res = await suspendDriver(user.id, suspendReason.trim());
        setToast({ open: true, message: res.message, variant: 'success' });
      } else if (action === 'reactivate') {
        await activateDriver(user.id);
        setToast({ open: true, message: 'Driver reactivated successfully', variant: 'success' });
      }
      setConfirm(null);
      setSuspendReason('');
      setDetailsUser(null);
      onUsersChange();
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

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-line-pill bg-surface-card px-3.5 py-1.5">
            <SearchIcon className="h-4 w-4 text-ink-placeholder" />
            <input
              type="search"
              value={query}
              onChange={(event) => onFilterChange('search', event.target.value)}
              placeholder="Search users..."
              className="w-40 bg-transparent text-sm text-ink-primary outline-none placeholder:text-ink-placeholder"
            />
          </div>
          {activeCount > 0 && (
            <ActiveFilterIndicator count={activeCount} onClearAll={onClearAll} />
          )}
          {/* TODO: wire invite-user flow to a real API */}
          <button
            type="button"
            onClick={openInvite}
            className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover"
          >
            <PlusIcon className="h-4 w-4" />
            Invite user
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-5">
          <AlertBanner icon={<AlertIcon className="h-4 w-4" />}>{error}</AlertBanner>
        </div>
      ) : null}

      {/* Content: loading, empty state, or table */}
      {loading ? (
        <div className="mt-5 flex flex-col items-center rounded-xl border border-line-card px-6 py-16">
          <p className="text-sm text-ink-tertiary">Loading drivers…</p>
        </div>
      ) : drivers.length === 0 ? (
        <FilterEmptyState
          filtersActive={activeCount > 0}
          onClearFilters={onClearAll}
          empty={
            <EmptyState onInvite={openInvite} />
          }
        />
      ) : (
        <PopulatedView
          users={drivers}
          filteredCount={total}
          totalPages={totalPages}
          currentPage={page}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onPageChange={goToPage}
          onViewDetails={setDetailsUser}
          onSuspend={(user) => setConfirm({ action: 'suspend', user })}
          onReactivate={(user) => setConfirm({ action: 'reactivate', user })}
        />
      )}

      <InviteDriverModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <DriverDetailsModal
        user={detailsUser}
        onClose={() => setDetailsUser(null)}
        onRequestAction={(action) => {
          if (!detailsUser) return;
          setConfirm({ action, user: detailsUser });
          setDetailsUser(null);
        }}
      />
      <ConfirmActionModal
        open={confirm !== null}
        action={confirm?.action ?? 'suspend'}
        userName={confirm?.user.fullName ?? ''}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        reason={isSuspending ? suspendReason : undefined}
        onReasonChange={isSuspending ? setSuspendReason : undefined}
        reasonPlaceholder="Why is this driver being suspended?"
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

function EmptyState({ onInvite }: { onInvite: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-line-card px-6 py-20">
      {/* Placeholder avatar illustration — TODO: swap for the final asset */}
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-tint">
        <UserIcon className="h-9 w-9 text-chip-violet-text" />
      </span>
      <h2 className="mt-5 text-lg font-semibold text-ink-primary">No users yet</h2>
      <p className="mt-2 max-w-sm text-center text-sm leading-relaxed text-ink-tertiary">
        There are no registered users on the platform yet. Once users sign up,
        they&apos;ll appear here for you to manage.
      </p>
      {/* TODO: wire invite flow to a real API */}
      <button
        type="button"
        onClick={onInvite}
        className="mt-6 flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover"
      >
        <PlusIcon className="h-4 w-4" />
        Invite
      </button>
    </div>
  );
}

type PopulatedViewProps = {
  users: Driver[];
  filteredCount: number;
  totalPages: number;
  currentPage: number;
  rangeStart: number;
  rangeEnd: number;
  onPageChange: (page: number) => void;
  onViewDetails: (user: Driver) => void;
  onSuspend: (user: Driver) => void;
  onReactivate: (user: Driver) => void;
};

function PopulatedView({
  users,
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
        <table className="w-full min-w-[860px] text-left text-sm">
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
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onViewDetails={onViewDetails}
                onSuspend={onSuspend}
                onReactivate={onReactivate}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards (tap card to open details, "..." menu for actions) */}
      <ul className="mt-5 flex flex-col gap-3 lg:hidden">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
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

function UserRow({
  user,
  onViewDetails,
  onSuspend,
  onReactivate,
}: {
  user: Driver;
  onViewDetails: (user: Driver) => void;
  onSuspend: (user: Driver) => void;
  onReactivate: (user: Driver) => void;
}) {
  return (
    <tr className="border-b border-line-divider last:border-b-0">
      <td className="px-4 py-3.5">
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white">
            {user.initials}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-ink-primary">{user.fullName}</span>
            <span className="truncate text-xs text-ink-placeholder">{user.email ?? ''}</span>
          </span>
        </span>
      </td>
      <td className="px-4 py-3.5 text-ink-secondary">{user.role}</td>
      <td className="px-4 py-3.5 text-ink-secondary">{user.fleetName}</td>
      <td className="px-4 py-3.5 text-ink-secondary">{user.city}</td>
      <td className="px-4 py-3.5 text-ink-secondary">{user.trustScore}</td>
      <td className="px-4 py-3.5 text-ink-secondary">{user.totalReports}</td>
      <td className="px-4 py-3.5">
        <StatusBadge
          label={STATUS_LABEL[user.status]}
          className={STATUS_BADGE_STYLES[user.status]}
        />
      </td>
      <td className="px-4 py-3.5">
        <UserActionsMenu
          userName={user.fullName}
          status={user.status}
          onViewDetails={() => onViewDetails(user)}
          onSuspend={() => onSuspend(user)}
          onReactivate={() => onReactivate(user)}
        />
      </td>
    </tr>
  );
}

function UserCard({
  user,
  onViewDetails,
  onSuspend,
  onReactivate,
}: {
  user: Driver;
  onViewDetails: (user: Driver) => void;
  onSuspend: (user: Driver) => void;
  onReactivate: (user: Driver) => void;
}) {
  return (
    <li
      role="button"
      tabIndex={0}
      onClick={() => onViewDetails(user)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onViewDetails(user);
        }
      }}
      className="flex cursor-pointer flex-col gap-3 rounded-xl border border-line-card bg-surface-card p-4 transition-colors hover:border-line-hover"
    >
      {/* Header: identity + status + actions */}
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white">
          {user.initials}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-ink-primary">{user.fullName}</span>
          <span className="truncate text-xs text-ink-placeholder">{user.email ?? ''}</span>
        </span>
        <StatusBadge
          label={STATUS_LABEL[user.status]}
          className={STATUS_BADGE_STYLES[user.status]}
        />
        <span onClick={(event) => event.stopPropagation()}>
          <UserActionsMenu
            userName={user.fullName}
            status={user.status}
            onViewDetails={() => onViewDetails(user)}
            onSuspend={() => onSuspend(user)}
            onReactivate={() => onReactivate(user)}
          />
        </span>
      </div>

      {/* Key metric */}
      <div className="flex items-center gap-2 border-t border-line-divider pt-3">
        <span className="text-xs text-ink-tertiary">Trust Score</span>
        <span className="ml-auto text-sm font-semibold text-ink-primary">{user.trustScore}%</span>
      </div>
    </li>
  );
}