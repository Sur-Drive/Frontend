'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { SearchIcon } from '@/components/ui/icons/SearchIcon';
import { CheckIcon } from '@/components/ui/icons/CheckIcon';
import { XIcon } from '@/components/ui/icons/XIcon';
import { ChevronLeftIcon } from '@/components/ui/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '@/components/ui/icons/ChevronRightIcon';
import { TrashIcon } from '@/components/ui/icons/TrashIcon';
import { ConfirmActionModal } from '@/components/admin/user-management/ConfirmActionModal';
import { Toast } from '@/components/ui/Toast';
import { ActiveFilterIndicator, FilterEmptyState } from '@/components/ui/ActiveFilterIndicator';
import { getHazards, rejectHazard, resolveHazard, deleteHazard } from '@/lib/hazards';
import { useTableFilters } from '@/lib/useTableFilters';
import type {
  Hazard,
  HazardStatus,
  HazardType,
  HazardSeverity,
  HazardStats,
  HazardsPagination,
} from '@/types';

type TypeTabId = HazardType | 'all';
type StatusTabId = HazardStatus;

const TYPE_TABS: { id: TypeTabId; label: string }[] = [
  { id: 'all', label: 'All Hazard' },
  { id: 'POTHOLE', label: 'Pothole' },
  { id: 'FLOOD', label: 'Flood' },
  { id: 'ACCIDENT', label: 'Accident' },
  { id: 'DEBRIS', label: 'Debris' },
  { id: 'ROAD', label: 'Road Works' },
  { id: 'CHECKPOINT', label: 'Checkpoint' },
  { id: 'DANGER', label: 'Danger Zone' },
  { id: 'SOS', label: 'SOS' },
];

const STATUS_TABS: { id: StatusTabId; label: string }[] = [
  { id: 'APPROVED', label: 'Active' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'RESOLVED', label: 'Resolved' },
];

const STATUS_BADGE: Record<HazardStatus, { label: string; className: string }> = {
  APPROVED: { label: 'Active', className: 'bg-status-success-bg text-status-success-text' },
  REJECTED: { label: 'Rejected', className: 'bg-status-danger-bg text-status-danger-text' },
  RESOLVED: { label: 'Resolved', className: 'bg-status-info-bg text-status-info-text' },
};

const SEVERITY_BADGE: Record<HazardSeverity, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'bg-status-neutral-bg text-status-neutral-text' },
  MEDIUM: { label: 'Medium', className: 'bg-status-warning-bg text-status-warning-text' },
  HIGH: { label: 'High', className: 'bg-status-danger-bg text-status-danger-text' },
  CRITICAL: { label: 'Critical', className: 'bg-status-danger-bg text-status-danger-text-vivid' },
};

const HAZARDS_PER_PAGE = 12;

function formatTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ModerationQueueView({
  initial,
}: {
  initial?: { status?: string; type?: string; search?: string; page?: string };
}) {
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
        param: 'status',
        label: 'Status',
        defaultValue: 'APPROVED',
        options: ['all', 'APPROVED', 'REJECTED', 'RESOLVED'],
      },
      {
        param: 'type',
        label: 'Type',
        defaultValue: 'all',
        options: [
          'all',
          'POTHOLE',
          'FLOOD',
          'ACCIDENT',
          'DEBRIS',
          'ROAD',
          'CHECKPOINT',
          'DANGER',
          'SOS',
        ],
      },
    ],
    search: { param: 'search', debounceMs: 300 },
    page: { param: 'page', default: 1 },
    initial,
  });

  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [stats, setStats] = useState<HazardStats | null>(null);
  const [pagination, setPagination] = useState<HazardsPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [confirmAction, setConfirmAction] = useState<
    { action: 'reject' | 'resolve' | 'delete'; hazard: Hazard } | null
  >(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; variant?: 'success' | 'error' }>({
    open: false,
    message: '',
  });

  // Fetch the page whenever the status/type/search filters or page changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getHazards({
      status: filterValues.status === 'all' ? undefined : filterValues.status,
      type: filterValues.type === 'all' ? undefined : filterValues.type,
      page,
      limit: HAZARDS_PER_PAGE,
      search: debouncedSearch || undefined,
    })
      .then((data) => {
        if (cancelled) return;
        setHazards(data.hazards);
        setStats(data.stats);
        setPagination(data.pagination);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load hazards.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filterValues.status, filterValues.type, debouncedSearch, page, refreshKey]);

  const noteValid = note.trim().length >= 3;

  const handleConfirm = async () => {
    if (!confirmAction) return;
    const { action, hazard } = confirmAction;
    if (action !== 'delete' && !noteValid) return;
    setSubmitting(true);
    try {
      if (action === 'reject') {
        const res = await rejectHazard(hazard.id, note.trim());
        setToast({ open: true, message: res.message, variant: 'success' });
      } else if (action === 'resolve') {
        const res = await resolveHazard(hazard.id, note.trim());
        setToast({ open: true, message: res.message, variant: 'success' });
      } else {
        const res = await deleteHazard(hazard.id);
        setToast({ open: true, message: res.message, variant: 'success' });
      }
      setConfirmAction(null);
      setNote('');
      setRefreshKey((k) => k + 1);
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

  const handleCancelConfirm = () => {
    setConfirmAction(null);
    setNote('');
  };

  const totalPages = pagination?.totalPages ?? 1;
  const safePage = Math.min(page, totalPages);
  const total = pagination?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (safePage - 1) * HAZARDS_PER_PAGE + 1;
  const rangeEnd = Math.min(safePage * HAZARDS_PER_PAGE, total);

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages));
  };

  return (
    <div className="flex flex-col gap-5">
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Active" value={stats.approved} className="text-status-success-text" />
          <StatCard label="Rejected" value={stats.rejected} className="text-status-danger-text" />
          <StatCard label="Resolved" value={stats.resolved} className="text-status-info-text" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-ink-placeholder">Status</span>
        {STATUS_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setFilter('status', item.id);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filterValues.status === item.id
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-ink-placeholder">Type</span>
          {TYPE_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setFilter('type', item.id);
              }}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filterValues.type === item.id
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
            value={filterValues.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="Search hazards..."
            className="w-40 bg-transparent text-sm text-ink-primary outline-none placeholder:text-ink-placeholder"
          />
        </div>
        {activeCount > 0 && (
          <ActiveFilterIndicator count={activeCount} onClearAll={clearAll} />
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-line-card bg-surface-card px-6 py-16 text-center">
          <p className="text-sm text-ink-tertiary">Loading hazards…</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-line-card bg-surface-card px-6 py-16 text-center">
          <p className="text-sm font-semibold text-status-danger-text">{error}</p>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="mt-3 text-sm font-medium text-brand-primary underline"
          >
            Retry
          </button>
        </div>
      ) : hazards.length === 0 ? (
        <FilterEmptyState
          filtersActive={activeCount > 0}
          onClearFilters={clearAll}
          empty={
            <div className="rounded-2xl border border-line-card bg-surface-card px-6 py-16 text-center">
              <p className="text-sm font-semibold text-ink-primary">No hazards to moderate</p>
              <p className="mt-1 text-sm text-ink-tertiary">
                Hazards matching this filter will appear here for review.</p>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {hazards.map((hazard) => (
            <HazardCard
              key={hazard.id}
              hazard={hazard}
              onReject={() => {
                setNote('');
                setConfirmAction({ action: 'reject', hazard });
              }}
              onResolve={() => {
                setNote('');
                setConfirmAction({ action: 'resolve', hazard });
              }}
              onDelete={() => {
                setNote('');
                setConfirmAction({ action: 'delete', hazard });
              }}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-tertiary">
          Showing {rangeStart}–{rangeEnd} of {total}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => goToPage(safePage - 1)}
            disabled={safePage <= 1}
            aria-label="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line-pill text-ink-secondary transition-colors hover:border-line-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => goToPage(pageNumber)}
              aria-current={pageNumber === safePage ? 'page' : undefined}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                pageNumber === safePage
                  ? 'bg-brand-primary text-white'
                  : 'border border-line-pill text-ink-secondary hover:border-line-hover'
              }`}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            onClick={() => goToPage(safePage + 1)}
            disabled={safePage >= totalPages}
            aria-label="Next page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line-pill text-ink-secondary transition-colors hover:border-line-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {confirmAction && (
        <ConfirmActionModal
          open
          action={confirmAction.action}
          userName={confirmAction.hazard.locationAddress}
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
          reason={note}
          onReasonChange={confirmAction.action === 'delete' ? undefined : setNote}
          reasonPlaceholder={
            confirmAction.action === 'reject'
              ? 'Why is this hazard being rejected?'
              : 'Add a resolution note...'
          }
          submitting={submitting}
        />
      )}

      <Toast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast({ open: false, message: '' })}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="rounded-xl border border-line-card bg-surface-card px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-placeholder">{label}</p>
      <p className={`mt-1 text-xl font-bold ${className ?? 'text-ink-primary'}`}>{value}</p>
    </div>
  );
}

function HazardCard({
  hazard,
  onReject,
  onResolve,
  onDelete,
}: {
  hazard: Hazard;
  onReject: () => void;
  onResolve: () => void;
  onDelete: () => void;
}) {
  const statusBadge = STATUS_BADGE[hazard.status];
  const severityBadge = SEVERITY_BADGE[hazard.severity];

  return (
    <article className="flex flex-col rounded-2xl border border-line-card bg-surface-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-surface-hover px-2.5 py-1 text-[11px] font-medium text-ink-secondary">
            {hazard.type}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${severityBadge.className}`}>
            {severityBadge.label}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-2.5 text-[11px] font-semibold">
          <span className="flex items-center gap-1 text-chip-green-text">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-chip-green-text">
              <CheckIcon className="h-3 w-3" />
            </span>
            {hazard.confirmations.confirmed}
          </span>
          <span className="flex items-center gap-1 text-status-danger-text">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-status-danger-text">
              <XIcon className="h-3 w-3" />
            </span>
            {hazard.confirmations.rejected}
          </span>
        </span>
      </div>

      <h3 className="mt-2.5 text-sm font-semibold text-ink-primary">{hazard.description}</h3>
      <p className="mt-1 truncate text-xs text-ink-placeholder">
        {hazard.locationAddress} · {formatTimeAgo(hazard.createdAt)} · {hazard.driver.fullName}
      </p>

      {hazard.photoUrl && (
        <div className="mt-3 h-32 w-full overflow-hidden rounded-lg bg-surface-hover">
          <Image
            src={hazard.photoUrl}
            alt={hazard.description}
            width={400}
            height={128}
            className="h-full w-full object-cover"
            unoptimized
          />
        </div>
      )}

      {hazard.status === 'APPROVED' ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onResolve}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-action-success-bg py-2 text-xs font-semibold text-white transition-colors hover:bg-action-success-hover"
          >
            <CheckIcon className="h-3.5 w-3.5" />
            Resolve
          </button>
          <button
            type="button"
            onClick={onReject}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-line-pill bg-surface-card py-2 text-xs font-semibold text-ink-primary transition-colors hover:bg-surface-hover"
          >
            <XIcon className="h-3.5 w-3.5" />
            Reject
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-line-pill bg-surface-card py-2 text-xs font-semibold text-status-danger-text-vivid transition-colors hover:bg-status-danger-bg"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      ) : hazard.status === 'REJECTED' && hazard.rejectedReason ? (
        <>
          <p className="mt-3 rounded-lg bg-status-danger-bg px-3 py-2 text-xs text-status-danger-text">
            <span className="font-semibold">Rejected:</span> {hazard.rejectedReason}
          </p>
          <button
            type="button"
            onClick={onDelete}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line-pill bg-surface-card py-2 text-xs font-semibold text-status-danger-text-vivid transition-colors hover:bg-status-danger-bg"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            Delete
          </button>
        </>
      ) : hazard.status === 'RESOLVED' && hazard.resolutionNote ? (
        <>
          <p className="mt-3 rounded-lg bg-status-info-bg px-3 py-2 text-xs text-status-info-text">
            <span className="font-semibold">Resolved:</span> {hazard.resolutionNote}
          </p>
          <button
            type="button"
            onClick={onDelete}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line-pill bg-surface-card py-2 text-xs font-semibold text-status-danger-text-vivid transition-colors hover:bg-status-danger-bg"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            Delete
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onDelete}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line-pill bg-surface-card py-2 text-xs font-semibold text-status-danger-text-vivid transition-colors hover:bg-status-danger-bg"
        >
          <TrashIcon className="h-3.5 w-3.5" />
          Delete
        </button>
      )}
    </article>
  );
}
