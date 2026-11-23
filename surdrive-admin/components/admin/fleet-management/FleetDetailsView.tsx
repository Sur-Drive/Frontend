'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@/components/ui/icons/ChevronLeftIcon';
import { FleetIcon } from '@/components/ui/icons/FleetIcon';
import { UsersIcon } from '@/components/ui/icons/UsersIcon';
import { GridIcon } from '@/components/ui/icons/GridIcon';
import { WalletIcon } from '@/components/ui/icons/WalletIcon';
import { MailIcon } from '@/components/ui/icons/MailIcon';
import { PhoneIcon } from '@/components/ui/icons/PhoneIcon';
import {
  ConfirmActionModal,
  type ConfirmActionType,
} from '@/components/admin/user-management/ConfirmActionModal';
import { Toast } from '@/components/ui/Toast';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getFleetById, suspendFleet, activateFleet } from '@/lib/fleets';
import type {
  DriverStatus,
  FleetDetail,
  FleetStatus,
  FleetVehicleStatus,
} from '@/types';

const STATUS_LABEL: Record<FleetStatus, string> = {
  active: 'Active',
  pending: 'Pending',
  suspended: 'Suspended',
  expired: 'Expired',
};

const STATUS_BADGE_STYLES: Record<FleetStatus, string> = {
  active: 'bg-status-success-bg text-status-success-text',
  pending: 'bg-status-warning-bg text-status-warning-text',
  suspended: 'bg-status-danger-bg text-status-danger-text',
  expired: 'bg-status-neutral-bg text-ink-tertiary',
};

// Vehicle statuses come from the API as uppercase enums; title-case for display.
const VEHICLE_STATUS_LABEL: Record<FleetVehicleStatus, string> = {
  AVAILABLE: 'Available',
  IN_USE: 'In Use',
  MAINTENANCE: 'Maintenance',
};

const VEHICLE_STATUS_BADGE_STYLES: Record<FleetVehicleStatus, string> = {
  AVAILABLE: 'bg-status-success-bg text-status-success-text',
  IN_USE: 'bg-status-info-bg text-status-info-text',
  MAINTENANCE: 'bg-status-warning-bg text-status-warning-text',
};

// Driver status inside fleet detail reuses the lowercase user-management statuses.
const DRIVER_STATUS_LABEL: Record<DriverStatus, string> = {
  active: 'Active',
  pending: 'Pending',
  inactive: 'Inactive',
  suspended: 'Suspended',
};

const DRIVER_STATUS_BADGE_STYLES: Record<DriverStatus, string> = {
  active: 'bg-status-success-bg text-status-success-text',
  pending: 'bg-status-warning-bg text-status-warning-text',
  inactive: 'bg-status-neutral-bg text-ink-tertiary',
  suspended: 'bg-status-danger-bg text-status-danger-text',
};

const PLAN_LABEL: Record<string, string> = {
  pro: 'Pro Fleet',
  starter: 'Starter Fleet',
  free_trial: 'Free Trial',
  enterprise: 'Enterprise',
};

/** Formats a numeric MRR amount as Naira, e.g. 105000 -> '₦105,000'. */
function formatMrr(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

/** Renders a raw status string safely — matches known statuses, else shows the raw value. */
function statusLabel(status: string): string {
  return STATUS_LABEL[status as FleetStatus] ?? status;
}

/** Neutral badge for statuses whose exact enum isn't known (subscription/sub-fleet). */
const NEUTRAL_BADGE_STYLES = 'bg-status-neutral-bg text-ink-tertiary';

type FleetDetailsViewProps = {
  fleetId: string;
};

/**
 * Fleet drill-down page content (route: /admin/fleet-management/[fleetId]).
 * Fetches the full fleet record from GET /admin/fleets/:id.
 */
export function FleetDetailsView({ fleetId }: FleetDetailsViewProps) {
  const [fleet, setFleet] = useState<FleetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmActionType | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [toast, setToast] = useState<{ open: boolean; message: string; variant?: 'success' | 'error' }>({
    open: false,
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getFleetById(fleetId)
      .then((data) => {
        if (cancelled) return;
        setFleet(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load fleet.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fleetId, refreshKey]);

  const isSuspending = confirm === 'fleet-suspend';
  const reasonValid = suspendReason.trim().length >= 3;

  const handleConfirm = async () => {
    if (!confirm || !fleet) return;
    setSubmitting(true);
    try {
      if (confirm === 'fleet-suspend') {
        if (!reasonValid) return;
        const res = await suspendFleet(fleet.id, suspendReason.trim());
        setToast({ open: true, message: res.message, variant: 'success' });
      } else if (confirm === 'fleet-reactivate') {
        await activateFleet(fleet.id);
        setToast({ open: true, message: 'Fleet reactivated successfully', variant: 'success' });
      }
      setConfirm(null);
      setSuspendReason('');
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

  const handleCancel = () => {
    setConfirm(null);
    setSuspendReason('');
  };

  if (loading) {
    return <FleetLoadingState />;
  }

  if (error || !fleet) {
    return <FleetNotFound />;
  }

  return (
    <DetailsLayout
      fleet={fleet}
      confirm={confirm}
      toast={toast}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      onOpenConfirm={setConfirm}
      onCloseToast={() => setToast({ open: false, message: '' })}
      suspendReason={suspendReason}
      onSuspendReasonChange={setSuspendReason}
      isSuspending={isSuspending}
      submitting={submitting}
    />
  );
}

type DetailsLayoutProps = {
  fleet: FleetDetail;
  confirm: ConfirmActionType | null;
  toast: { open: boolean; message: string; variant?: 'success' | 'error' };
  onConfirm: () => void;
  onCancel: () => void;
  onOpenConfirm: (action: ConfirmActionType) => void;
  onCloseToast: () => void;
  suspendReason: string;
  onSuspendReasonChange: (value: string) => void;
  isSuspending: boolean;
  submitting: boolean;
};

function DetailsLayout({
  fleet,
  confirm,
  toast,
  onConfirm,
  onCancel,
  onOpenConfirm,
  onCloseToast,
  suspendReason,
  onSuspendReasonChange,
  isSuspending,
  submitting,
}: DetailsLayoutProps) {
  const chips = [
    {
      id: 'vehicles',
      label: 'Total Vehicles',
      value: String(fleet.stats.totalVehicles),
      Icon: FleetIcon,
      iconWrap: 'bg-status-info-bg text-status-info-text',
    },
    {
      id: 'drivers',
      label: 'Total Drivers',
      value: String(fleet.stats.totalDrivers),
      Icon: UsersIcon,
      iconWrap: 'bg-chip-teal-bg text-chip-teal-text',
    },
    {
      id: 'subfleet',
      label: 'Sub Fleet',
      value: String(fleet.stats.totalSubFleets).padStart(2, '0'),
      Icon: GridIcon,
      iconWrap: 'bg-brand-tint text-[#8B5CF6]',
    },
    {
      id: 'revenue',
      label: 'Monthly revenue',
      value: formatMrr(fleet.mrr),
      Icon: WalletIcon,
      iconWrap: 'bg-status-warning-bg text-[#F0B429]',
    },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/fleet-management"
        className="flex w-fit items-center gap-1.5 rounded-full border border-line-pill bg-surface-card px-3.5 py-1.5 text-sm font-medium text-ink-secondary transition-colors hover:border-line-hover hover:text-ink-primary"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to Fleet List
      </Link>

      {/* Header + status-dependent action */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Fleet Details</h1>
          <p className="mt-1 text-sm text-ink-tertiary">
            View and manage fleet information, assigned resources, and operational details.
          </p>
        </div>
        {/* TODO: wire to real fleet status-update API */}
        {fleet.status === 'active' && (
          <button
            type="button"
            onClick={() => onOpenConfirm('fleet-suspend')}
            className="rounded-xl bg-[#F5A623] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#E08E0B]"
          >
            Suspend Fleet
          </button>
        )}
        {fleet.status === 'suspended' && (
          <button
            type="button"
            onClick={() => onOpenConfirm('fleet-reactivate')}
            className="rounded-xl bg-[#17A277] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#128560]"
          >
            Reactivate Fleet
          </button>
        )}
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {chips.map((chip) => (
          <div
            key={chip.id}
            className="flex items-center gap-3 rounded-2xl border border-line-card bg-surface-card p-5"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${chip.iconWrap}`}
            >
              <chip.Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-bold text-ink-primary">{chip.value}</p>
              <p className="text-xs text-ink-tertiary">{chip.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <FleetInfoCard fleet={fleet} />
          <VehiclesCard fleet={fleet} />
          <DriversCard fleet={fleet} />
        </div>
        <div className="flex flex-col gap-6">
          <PlanCard fleet={fleet} />
          <ManagersCard fleet={fleet} />
          <SubFleetsCard fleet={fleet} />
        </div>
      </div>

      <ConfirmActionModal
        open={confirm !== null}
        action={confirm ?? 'fleet-suspend'}
        userName={fleet.companyName}
        onConfirm={onConfirm}
        onCancel={onCancel}
        reason={isSuspending ? suspendReason : undefined}
        onReasonChange={isSuspending ? onSuspendReasonChange : undefined}
        reasonPlaceholder="Why is this fleet being suspended?"
        submitting={submitting}
      />
      <Toast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={onCloseToast}
      />
    </div>
  );
}

function FleetLoadingState() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line-card bg-surface-card px-6 py-20">
      <p className="text-sm text-ink-tertiary">Loading fleet…</p>
    </div>
  );
}

function FleetNotFound() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line-card bg-surface-card px-6 py-20">
      {/* Placeholder illustration — TODO: swap for the final asset */}
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-tint">
        <FleetIcon className="h-9 w-9 text-[#8B5CF6]" />
      </span>
      <h2 className="mt-5 text-lg font-semibold text-ink-primary">Fleet not found</h2>
      <p className="mt-2 max-w-sm text-center text-sm leading-relaxed text-ink-tertiary">
        The fleet you are looking for does not exist or is no longer available.
      </p>
      <Link
        href="/admin/fleet-management"
        className="mt-5 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-hover"
      >
        Back to Fleet List
      </Link>
    </div>
  );
}

function CardShell({ title, count, children }: { title: string; count?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line-card bg-surface-card p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-ink-primary">
        {title}
        {count ? ` (${count})` : ''}
      </h2>
      {children}
    </section>
  );
}

function FleetInfoCard({ fleet }: { fleet: FleetDetail }) {
  return (
    <CardShell title="Fleet Information">
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-line-card px-4 py-3.5">
        <div>
          <p className="text-lg font-semibold text-ink-primary">{fleet.companyName}</p>
          <p className="mt-0.5 text-xs text-ink-placeholder">
            {fleet.fleetCode} · {fleet.location}
          </p>
          <p className="mt-1 text-xs text-ink-tertiary">
            Owner: {fleet.owner.fullName} · {fleet.industry}
          </p>
        </div>
        <StatusBadge
          label={STATUS_LABEL[fleet.status]}
          className={STATUS_BADGE_STYLES[fleet.status]}
        />
      </div>
    </CardShell>
  );
}

function VehiclesCard({ fleet }: { fleet: FleetDetail }) {
  return (
    <CardShell title="Vehicles" count={String(fleet.stats.totalVehicles)}>
      {/* TODO: wire to real paginated vehicle list for the fleet */}
      <ul className="mt-4 flex max-h-[24rem] flex-col gap-2.5 overflow-y-auto pr-1">
        {fleet.vehicles.map((vehicle) => (
          <li
            key={vehicle.id}
            className="flex items-center gap-3 rounded-xl border border-line-card px-3.5 py-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-[#8B5CF6]">
              <FleetIcon className="h-4 w-4" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm">
                <span className="font-semibold text-ink-primary">{vehicle.registrationNumber}</span>
                <span className="text-ink-placeholder"> · {vehicle.make} {vehicle.model}</span>
              </span>
              <span className="truncate text-xs text-ink-placeholder">
                {vehicle.vehicleType} · Driver: {vehicle.driver?.fullName ?? '—'}
              </span>
            </span>
            <StatusBadge
              label={VEHICLE_STATUS_LABEL[vehicle.status]}
              className={VEHICLE_STATUS_BADGE_STYLES[vehicle.status]}
            />
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

function DriversCard({ fleet }: { fleet: FleetDetail }) {
  return (
    <CardShell title="Drivers" count={String(fleet.stats.totalDrivers)}>
      {/* TODO: wire to real paginated driver list for the fleet */}
      <ul className="mt-4 flex max-h-[24rem] flex-col gap-2.5 overflow-y-auto pr-1">
        {fleet.drivers.map((driver) => (
          <li
            key={driver.id}
            className="flex items-center gap-3 rounded-xl border border-line-card px-3.5 py-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white">
              {driver.initials}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold text-ink-primary">{driver.fullName}</span>
              <span className="truncate text-xs text-ink-placeholder">{driver.phoneNumber}</span>
              <span className="truncate text-xs text-ink-placeholder">
                Vehicle: {driver.assignedVehicle ?? '—'}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1">
              <StatusBadge
                label={DRIVER_STATUS_LABEL[driver.status]}
                className={DRIVER_STATUS_BADGE_STYLES[driver.status]}
              />
              <span className="text-xs text-ink-placeholder">
                {driver.totalTrips} trips · {driver.totalKilometers} km
              </span>
            </span>
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

function PlanCard({ fleet }: { fleet: FleetDetail }) {
  const { subscription } = fleet;
  const planName = PLAN_LABEL[subscription.plan] ?? subscription.plan;
  return (
    <CardShell title="Current Plan">
      <div className="mt-4 rounded-xl border border-line-card px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <StatusBadge
            label={statusLabel(subscription.status)}
            className={NEUTRAL_BADGE_STYLES}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-base font-semibold text-ink-primary">{planName}</p>
          <p className="text-sm">
            <span className="font-bold text-ink-primary">
              {`₦${subscription.pricePerVehicle.toLocaleString('en-NG')}`}
            </span>{' '}
            <span className="text-xs text-ink-placeholder">/per vehicle monthly</span>
          </p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-placeholder">{fleet.briefDescription}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink-placeholder">
            Next billing on{' '}
            <span className="font-semibold text-ink-secondary">{subscription.endDate}</span>
          </p>
          {/* TODO: wire Change Plan to the plan-change flow */}
          <button
            type="button"
            className="rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-accent-hover"
          >
            Change Plan
          </button>
        </div>
      </div>
    </CardShell>
  );
}

function ManagersCard({ fleet }: { fleet: FleetDetail }) {
  return (
    <CardShell title="Fleet Managers" count={String(fleet.stats.totalManagers)}>
      {/* TODO: wire to real fleet manager list */}
      <ul className="mt-4 flex flex-col gap-2.5">
        {fleet.managers.map((manager) => (
          <li
            key={manager.id}
            className="flex items-center gap-3 rounded-xl border border-line-card px-3.5 py-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white">
              {manager.initials}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-ink-primary">{manager.fullName}</span>
                <span className="shrink-0 rounded-full bg-brand-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8B5CF6]">
                  {manager.role}
                </span>
              </span>
              <span className="truncate text-xs text-ink-placeholder">{manager.phoneNumber}</span>
              <span className="truncate text-xs text-ink-placeholder">{manager.email}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              {/* TODO: wire icon buttons to real contact actions */}
              <button
                type="button"
                aria-label={`Call ${manager.fullName}`}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-line-card text-ink-secondary transition-colors hover:bg-surface-hover"
              >
                <PhoneIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Email ${manager.fullName}`}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-line-card text-ink-secondary transition-colors hover:bg-surface-hover"
              >
                <MailIcon className="h-3.5 w-3.5" />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

function SubFleetsCard({ fleet }: { fleet: FleetDetail }) {
  return (
    <CardShell title="Sub Fleet" count={String(fleet.stats.totalSubFleets)}>
      {/* TODO: wire to real sub-fleet list */}
      <ul className="mt-4 flex flex-col gap-2.5">
        {fleet.subFleets.map((subFleet) => (
          <li
            key={subFleet.id}
            className="flex items-center gap-3 rounded-xl border border-line-card px-3.5 py-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-status-neutral-bg text-ink-secondary">
              <FleetIcon className="h-4 w-4" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-ink-primary">{subFleet.name}</span>
              <span className="truncate text-xs text-ink-placeholder">
                {subFleet.region} · {subFleet.vehicleCount} vehicles · {subFleet.driverCount} drivers
              </span>
            </span>
            <StatusBadge
              label={statusLabel(subFleet.status)}
              className={NEUTRAL_BADGE_STYLES}
            />
          </li>
        ))}
      </ul>
    </CardShell>
  );
}