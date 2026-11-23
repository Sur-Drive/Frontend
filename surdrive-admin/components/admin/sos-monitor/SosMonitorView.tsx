'use client';

import { useCallback, useEffect, useState } from 'react';
import { SearchIcon } from '@/components/ui/icons/SearchIcon';
import { CheckIcon } from '@/components/ui/icons/CheckIcon';
import { ShieldIcon } from '@/components/ui/icons/ShieldIcon';
import { PhoneIcon } from '@/components/ui/icons/PhoneIcon';
import { XIcon } from '@/components/ui/icons/XIcon';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Toast } from '@/components/ui/Toast';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ActiveFilterIndicator } from '@/components/ui/ActiveFilterIndicator';
import { FilterPopover } from '@/components/ui/FilterPopover';
import { getSosAlerts, resolveSosAlert, confirmSosAlert, cancelSosAlert } from '@/lib/sos';
import { useTableFilters } from '@/lib/useTableFilters';
import { MapPanel } from './MapPanel';
import type { SosAlert, SosResponse } from '@/types';

/** Known statuses get design-matched labels/colors; unknowns fall back to neutral. */
const STATUS_META: Record<string, { label: string; badge: string }> = {
  PENDING: { label: 'SOS', badge: 'bg-status-danger-bg text-status-danger-text' },
  CONFIRMED: { label: 'Confirmed', badge: 'bg-status-warning-bg text-status-warning-text' },
  RESOLVED: { label: 'Resolved', badge: 'bg-status-success-bg text-status-success-text' },
  CANCELLED: { label: 'Cancelled', badge: 'bg-status-neutral-bg text-status-neutral-text' },
};

/** Status filter options for the filter popover — derived from STATUS_META keys. */
const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...Object.keys(STATUS_META).map((value) => ({ value, label: STATUS_META[value].label })),
];
const NEUTRAL_BADGE = 'bg-status-neutral-bg text-status-neutral-text';

function statusMeta(status: string) {
  return (
    STATUS_META[status] ?? {
      label: status.charAt(0) + status.slice(1).toLowerCase(),
      badge: NEUTRAL_BADGE,
    }
  );
}

/** Compact relative timestamp for list cards, e.g. '6m ago'. */
function formatTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * SOS Monitor — incident list + live map (MapPanel) + incident detail panel.
 */
export function SosMonitorView({
  initial,
}: {
  initial?: { status?: string; search?: string; fromDate?: string; toDate?: string };
}) {
  const {
    filters: filterValues,
    debouncedSearch,
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
        options: ['all', 'PENDING', 'CONFIRMED', 'RESOLVED', 'CANCELLED'],
      },
      { param: 'fromDate', label: 'From', defaultValue: '' },
      { param: 'toDate', label: 'To', defaultValue: '' },
    ],
    search: { param: 'search', debounceMs: 300 },
    initial,
  });

  const [data, setData] = useState<SosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Page 1 with a high limit — no pagination UI for now. Status/search/date
  // filters go to the backend as query params (all supported by GET /admin/sos);
  // the local date strings are passed through unconverted, so the range is
  // interpreted in the admin's local timezone.
  const fetchAlerts = useCallback(async () => {
    try {
      const result = await getSosAlerts({
        page: 1,
        limit: 100,
        status: filterValues.status === 'all' ? undefined : filterValues.status,
        search: debouncedSearch || undefined,
        fromDate: filterValues.fromDate || undefined,
        toDate: filterValues.toDate || undefined,
      });
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SOS alerts');
    } finally {
      setLoading(false);
    }
  }, [
    filterValues.status,
    filterValues.fromDate,
    filterValues.toDate,
    debouncedSearch,
  ]);

  useEffect(() => {
    void fetchAlerts();
  }, [fetchAlerts]);

  const alerts = data?.alerts ?? [];
  const stats = data?.stats ?? null;

  const handleDateChange = (next: { from: string | null; to: string | null }) => {
    setFilter('fromDate', next.from ?? '');
    setFilter('toDate', next.to ?? '');
  };

  const selected = alerts.find((alert) => alert.id === selectedId) ?? null;

  const tiles = stats
    ? [
        { id: 'active', label: 'Total Active SOS', dotClass: 'bg-[#F04438]', value: stats.active },
        { id: 'pending', label: 'Pending', dotClass: 'bg-[#98A2B3]', value: stats.pending },
        { id: 'confirmed', label: 'Confirmed', dotClass: 'bg-[#F5A623]', value: stats.confirmed },
        { id: 'resolved', label: 'Resolved', dotClass: 'bg-[#12B76A]', value: stats.resolved },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-ink-tertiary">
        Loading SOS alerts…
      </div>
    );
  }

  if (error) {
    return (
      <AlertBanner
        icon={<ShieldIcon className="h-5 w-5" />}
        className="border-status-danger-bg bg-status-danger-bg text-status-danger-text-strong"
      >
        {error}
      </AlertBanner>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stat tiles — derived from the API stats object */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <div
            key={tile.id}
            className="rounded-2xl border border-line-card bg-surface-card p-4"
          >
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-ink-secondary">
              <span className={`h-2 w-2 rounded-full ${tile.dotClass}`} aria-hidden="true" />
              {tile.label}
            </p>
            <p className="mt-1.5 text-xl font-bold text-ink-primary">{tile.value}</p>
          </div>
        ))}
      </div>

      {/* Incident list + map (+ detail panel when an incident is selected) */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterPopover
          open={filtersOpen}
          onToggle={() => setFiltersOpen((value) => !value)}
          onClose={() => setFiltersOpen(false)}
          statusOptions={STATUS_OPTIONS}
          activeStatus={filterValues.status}
          onStatusChange={(value) => setFilter('status', value)}
          showDateRange
          dateFrom={filterValues.fromDate || null}
          dateTo={filterValues.toDate || null}
          onDateChange={handleDateChange}
          onClearAll={clearAll}
        />
        {activeCount > 0 && (
          <ActiveFilterIndicator count={activeCount} onClearAll={clearAll} />
        )}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:h-[600px]">
        <IncidentListPanel
          incidents={alerts}
          totalCount={alerts.length}
          query={filterValues.search}
          onQueryChange={setSearch}
          selectedId={selectedId}
          onSelect={setSelectedId}
          activeCount={activeCount}
          onClearFilters={clearAll}
        />
        {/* Real map — fed the same alerts the list shows, pins select incidents.
            Its refresh control reuses this view's own fetch function. */}
        <MapPanel
          alerts={alerts}
          selectedId={selectedId}
          onSelectAlert={setSelectedId}
          onRefresh={fetchAlerts}
        />
        {selected && <DetailPanel incident={selected} onClose={() => setSelectedId(null)} onRefresh={fetchAlerts} />}
      </div>

      <Toast
        open={toastMessage !== null}
        message={toastMessage ?? ''}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}

type IncidentListPanelProps = {
  incidents: SosAlert[];
  totalCount: number;
  query: string;
  onQueryChange: (query: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Number of active filters — drives the empty state wording. */
  activeCount: number;
  onClearFilters: () => void;
};

function IncidentListPanel({
  incidents,
  totalCount,
  query,
  onQueryChange,
  selectedId,
  onSelect,
  activeCount,
  onClearFilters,
}: IncidentListPanelProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col rounded-2xl border border-line-card bg-surface-card p-3 lg:w-[280px]">
      <div className="flex items-center gap-2 rounded-full border border-line-pill px-3.5 py-1.5">
        <SearchIcon className="h-4 w-4 text-ink-placeholder" />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search trip, driver..."
          className="w-full bg-transparent text-xs text-ink-primary outline-none placeholder:text-ink-placeholder"
        />
      </div>

      <p className="mt-3 px-1 text-xs text-ink-tertiary">{totalCount} active</p>

      {/* Empty state — filter-aware, with a Clear filters action */}
      {incidents.length === 0 ? (
        <div className="mt-2 flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line-pill px-4 py-8 text-center">
          <p className="text-sm font-semibold text-ink-primary">
            {activeCount > 0 ? 'No results match your filters' : 'No active SOS alerts'}
          </p>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-1 text-xs font-medium text-brand-primary underline underline-offset-2 transition-colors hover:text-brand-primary-hover"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <ul className="mt-2 flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              selected={incident.id === selectedId}
              onClick={() => onSelect(incident.id)}
            />
          ))}
        </ul>
      )}
    </aside>
  );
}

function IncidentCard({
  incident,
  selected,
  onClick,
}: {
  incident: SosAlert;
  selected: boolean;
  onClick: () => void;
}) {
  const meta = statusMeta(incident.status);

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={`w-full rounded-xl p-3 text-left transition-colors ${
          selected ? 'bg-status-danger-bg' : 'hover:bg-surface-subtle'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <StatusBadge label={meta.label} className={meta.badge} />
          <span className="truncate text-[10px] text-ink-placeholder">
            {formatTimeAgo(incident.updatedAt)} · By {incident.driver?.fullName ?? 'Unknown driver'}
          </span>
        </div>
        <p className="mt-2 truncate text-sm font-semibold text-ink-primary">{incident.message}</p>
        <div className="mt-1 flex items-end justify-between gap-2">
          <p className="truncate text-xs text-ink-placeholder">{incident.locationAddress}</p>
          {/* Contacts notified count (the old views/comments placeholders are gone) */}
          <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-medium text-status-success-text">
            <EyeStatIcon />
            {incident.contactsNotified}
          </span>
        </div>
      </button>
    </li>
  );
}

function EyeStatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3 w-3"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function DetailPanel({
  incident,
  onClose,
  onRefresh,
}: {
  incident: SosAlert;
  onClose: () => void;
  onRefresh?: () => void;
}) {
  const [actionMode, setActionMode] = useState<'confirm' | 'cancel' | 'resolve' | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  const isPending = incident.status === 'PENDING';
  const isConfirmed = incident.status === 'CONFIRMED';

  const showConfirmCancel = isPending;
  const showResolve = isPending || isConfirmed;

  const openMode = (mode: 'confirm' | 'cancel' | 'resolve') => {
    setNote('');
    setActionError(null);
    setActionMode(mode);
  };

  const closeAction = () => {
    setActionMode(null);
    setNote('');
    setActionError(null);
  };

  const handleSubmit = async () => {
    if (!actionMode || note.trim().length === 0) return;
    setSubmitting(true);
    setActionError(null);
    try {
      if (actionMode === 'confirm') {
        await confirmSosAlert(incident.id, note.trim());
        setToast({ message: 'SOS alert confirmed.', variant: 'success' });
      } else if (actionMode === 'cancel') {
        await cancelSosAlert(incident.id, note.trim());
        setToast({ message: 'SOS alert cancelled.', variant: 'success' });
      } else {
        await resolveSosAlert(incident.id, note.trim());
        setToast({ message: 'SOS alert resolved.', variant: 'success' });
      }
      setActionMode(null);
      setNote('');
      onRefresh?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setActionError(message);
      setToast({ message, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const vehicleLabel = incident.vehicle
    ? `${incident.vehicle.make} ${incident.vehicle.model} · ${incident.vehicle.registrationNumber}`
    : '—';

  const meta = statusMeta(incident.status);
  const placeholder =
    actionMode === 'cancel'
      ? 'Reason for cancelling (required)'
      : actionMode === 'confirm'
        ? 'Note about the confirmation (required)'
        : 'Resolution note (required)';
  const submitLabel =
    actionMode === 'confirm' ? 'Confirm Emergency' : actionMode === 'cancel' ? 'Confirm Cancel' : 'Confirm';
  const submitClass =
    actionMode === 'confirm'
      ? 'bg-action-danger-bg hover:bg-action-danger-hover'
      : actionMode === 'cancel'
        ? 'bg-action-warning-bg hover:bg-action-warning-hover'
        : 'bg-action-success-bg hover:bg-action-success-hover';
  const infoRows: { label: string; value: string; withPhoneIcon?: boolean }[] = [
    { label: 'Type', value: incident.type },
    { label: 'Driver', value: incident.driver?.fullName ?? '—' },
    {
      label: 'Phone',
      value: incident.driver?.phoneNumber ?? '—',
      withPhoneIcon: Boolean(incident.driver?.phoneNumber),
    },
    { label: 'Vehicle', value: vehicleLabel },
    { label: 'Fleet', value: incident.driver?.fleetName || '—' },
    { label: 'Location', value: incident.locationAddress },
    { label: 'Reported', value: formatTimeAgo(incident.createdAt) },
  ];

  return (
    <aside className="fixed inset-0 z-20 flex flex-col overflow-y-auto rounded-2xl border border-line-card bg-surface-card p-4 lg:static lg:inset-auto lg:z-auto lg:w-[220px] lg:shrink-0 lg:overflow-y-visible">
      <p className="text-xs text-ink-placeholder">Incident</p>
      <div className="mt-1 flex items-start justify-between gap-2">
        <h2 className="text-base font-bold text-ink-primary">{incident.id}</h2>
        <div className="flex items-center gap-2">
          <StatusBadge label={meta.label} className={meta.badge} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close incident detail"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-ink-primary lg:hidden"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Info rows */}
      <dl className="mt-4 flex flex-col gap-2.5">
        {infoRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-2">
            <dt className="shrink-0 text-xs text-ink-placeholder">{row.label}</dt>
            <dd className="flex min-w-0 items-center gap-1 text-right text-xs font-medium text-ink-primary">
              <span className="truncate">{row.value}</span>
              {row.withPhoneIcon && <PhoneIcon className="h-3 w-3 shrink-0 text-ink-placeholder" />}
            </dd>
          </div>
        ))}
      </dl>

      {/* Coordinates box */}
      <div className="mt-4 rounded-xl bg-surface-subtle p-3">
        <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-ink-placeholder">
          <ShieldIcon className="h-3 w-3 text-chip-violet-text" />
          Coordinates
        </p>
        <p className="mt-1 text-sm font-semibold text-ink-primary">
          {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {/* Call Driver — plain tel: link, no API needed.
            Hidden when the alert has no linked driver/phone number. */}
        {incident.driver?.phoneNumber && (
          <a
            href={`tel:${incident.driver.phoneNumber}`}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-line-pill bg-surface-card py-2 text-xs font-semibold text-ink-primary transition-colors hover:border-line-hover"
          >
            <PhoneIcon className="h-3.5 w-3.5" />
            Call Driver
          </a>
        )}

        {actionMode ? (
          <div className="flex flex-col gap-2 rounded-xl border border-line-card bg-surface-subtle p-2.5">
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={placeholder}
              className="w-full resize-none rounded-lg border border-line-pill bg-surface-card p-2 text-xs text-ink-primary outline-none placeholder:text-ink-placeholder"
            />
            {actionError && (
              <p className="text-[10px] leading-4 text-status-danger-text">{actionError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || note.trim().length === 0}
                className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${submitClass}`}
              >
                {submitting
                  ? 'Working…'
                  : submitLabel}
              </button>
              <button
                type="button"
                onClick={closeAction}
                disabled={submitting}
                className="flex-1 rounded-lg border border-line-pill bg-surface-card py-1.5 text-[11px] font-semibold text-ink-secondary transition-colors hover:bg-surface-hover disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {showConfirmCancel && (
              <>
                <button
                  type="button"
                  onClick={() => openMode('confirm')}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-action-danger-bg py-2 text-xs font-semibold text-white transition-colors hover:bg-action-danger-hover"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => openMode('cancel')}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-action-warning-bg py-2 text-xs font-semibold text-white transition-colors hover:bg-action-warning-hover"
                >
                  Cancel
                </button>
              </>
            )}
            {showResolve && (
              <button
                type="button"
                onClick={() => openMode('resolve')}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-action-success-bg py-2 text-xs font-semibold text-white transition-colors hover:bg-action-success-hover"
              >
                <CheckIcon className="h-3.5 w-3.5" />
                Mark resolved
              </button>
            )}
          </>
        )}
      </div>

      {toast && (
        <Toast
          open={!!toast}
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
    </aside>
  );
}
