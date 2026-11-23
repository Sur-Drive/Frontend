'use client';

import { XIcon } from '@/components/ui/icons/XIcon';
import { UserMinusIcon } from '@/components/ui/icons/UserMinusIcon';
import { SendIcon } from '@/components/ui/icons/SendIcon';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useModalBehavior } from '@/lib/useModalBehavior';
import type { Driver, DriverStatus } from '@/types';
import type { ConfirmActionType } from './ConfirmActionModal';

/** Which confirmation action the bottom button triggers, per current status */
const STATUS_ACTION: Record<DriverStatus, ConfirmActionType> = {
  active: 'suspend',
  suspended: 'reactivate',
  pending: 'resend',
  inactive: 'reactivate',
};

const STATUS_LABEL: Record<DriverStatus, string> = {
  active: 'Active',
  pending: 'Pending',
  inactive: 'Suspended',
  suspended: 'Suspended',
};

const STATUS_BADGE_STYLES: Record<DriverStatus, string> = {
  active: 'bg-status-success-bg text-status-success-text',
  pending: 'bg-status-warning-bg text-status-warning-text',
  inactive: 'bg-status-danger-bg text-status-danger-text',
  suspended: 'bg-status-danger-bg text-status-danger-text',
};

const ACTION_BUTTON_STYLES: Record<
  DriverStatus,
  { label: string; className: string }
> = {
  active: {
    label: 'Suspend',
    className: 'bg-action-warning-bg hover:bg-action-warning-hover text-white',
  },
  suspended: {
    label: 'Reactivate',
    className: 'bg-action-success-bg hover:bg-action-success-hover text-white',
  },
  pending: {
    label: 'Resend Invite',
    className: 'bg-brand-accent hover:bg-brand-accent-hover text-white',
  },
  inactive: {
    label: 'Reactivate',
    className: 'bg-action-success-bg hover:bg-action-success-hover text-white',
  },
};

type DriverDetailsModalProps = {
  user: Driver | null;
  onClose: () => void;
  /** Fires when the bottom action button is clicked — parent opens the confirm modal */
  onRequestAction: (action: ConfirmActionType) => void;
};

export function DriverDetailsModal({ user, onClose, onRequestAction }: DriverDetailsModalProps) {
  // This dialog keys off the entity rather than an `open` flag: mounted with a
  // user selected is what "open" means here, so that is what the hook is told.
  useModalBehavior({ open: user !== null, onClose });

  if (!user) return null;

  const details = {
    driverId: user.id,
    phone: user.phoneNumber,
    subFleet: user.subFleetName || '—',
    vehicle: '—', // TODO: resolve from a vehicles API when available
    license: user.licenseNumber,
    trips: user.totalTrips,
    kilometres: `${user.totalKilometers.toLocaleString()} km`,
    totalReports: user.totalReports,
    confirmedReports: user.confirmedReports,
    falseReports: user.falseReports,
  };
  const action = ACTION_BUTTON_STYLES[user.status];
  const ActionIcon = user.status === 'pending' ? SendIcon : UserMinusIcon;

  const infoItems: { label: string; value: string | number }[] = [
    { label: 'Sub-fleet', value: details.subFleet },
    { label: 'Assigned Vehicle', value: details.vehicle },
    { label: 'License Number', value: details.license },
    { label: 'Trips', value: details.trips },
    { label: "Kilometre's", value: details.kilometres },
    { label: 'Trust Score (%)', value: user.trustScore },
  ];

  const reportChips = [
    { label: 'Total Report', value: details.totalReports, bg: 'bg-brand-tint', text: 'text-brand-accent' },
    { label: 'Confirmed Report', value: details.confirmedReports, bg: 'bg-status-success-bg', text: 'text-status-success-text' },
    { label: 'False Report', value: details.falseReports, bg: 'bg-status-warning-bg', text: 'text-status-warning-text' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="driver-details-title"
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-surface-card p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="driver-details-title" className="text-lg font-semibold text-ink-primary">
              Driver Details
            </h2>
            <p className="mt-1 text-sm text-ink-tertiary">
              Drivers profile, scope, and assignments.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-placeholder transition-colors hover:bg-surface-hover hover:text-ink-primary"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Profile row */}
        <div className="mt-5 flex items-center gap-3.5">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white bg-brand-primary`}
          >
            {user.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-ink-primary">{user.fullName}</p>
            <p className="truncate text-sm text-ink-tertiary">
              {details.driverId} • {details.phone}
            </p>
          </div>
          <StatusBadge
            label={STATUS_LABEL[user.status]}
            className={STATUS_BADGE_STYLES[user.status]}
          />
        </div>

        {/* Info grid */}
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-surface-subtle p-5 sm:grid-cols-3">
          {infoItems.map((item) => (
            <div key={item.label}>
              <p className="text-xs text-ink-placeholder">{item.label}</p>
              <p className="mt-0.5 text-sm font-medium text-ink-primary">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Report chips */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {reportChips.map((chip) => (
            <div key={chip.label} className={`rounded-xl px-4 py-3 ${chip.bg}`}>
              <p className={`text-lg font-bold ${chip.text}`}>
                {String(chip.value).padStart(2, '0')}
              </p>
              <p className={`text-xs ${chip.text} opacity-80`}>{chip.label}</p>
            </div>
          ))}
        </div>

        {/* Bottom action — opens confirmation step */}
        <button
          type="button"
          onClick={() => onRequestAction(STATUS_ACTION[user.status])}
          className={`mt-6 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${action.className}`}
        >
          <ActionIcon className="h-4 w-4" />
          {action.label}
        </button>
      </div>
    </div>
  );
}