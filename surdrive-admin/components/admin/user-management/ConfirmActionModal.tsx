'use client';

import { AlertIcon } from '@/components/ui/icons/AlertIcon';
import { CheckIcon } from '@/components/ui/icons/CheckIcon';
import { MailIcon } from '@/components/ui/icons/MailIcon';
import { TrashIcon } from '@/components/ui/icons/TrashIcon';
import { UserMinusIcon } from '@/components/ui/icons/UserMinusIcon';
import { XIcon } from '@/components/ui/icons/XIcon';
import { useModalBehavior } from '@/lib/useModalBehavior';

export type ConfirmActionType =
  | 'suspend'
  | 'reactivate'
  | 'resend'
  | 'fleet-suspend'
  | 'fleet-reactivate'
  | 'reject'
  | 'resolve'
  | 'delete';

type ActionConfig = {
  heading: (name: string) => string;
  /** One paragraph (string) or several stacked paragraphs (string[]) */
  description: (name: string) => string | string[];
  buttonLabel: string;
  /** Tailwind classes for the solid confirm button */
  buttonClass: string;
  /** Icon rendered inside the tinted circle at the top of the modal */
  CircleIcon: typeof AlertIcon;
  /** Background color class for the tinted circle */
  circleClass: string;
  /** Color class for the circle icon */
  circleIconClass: string;
  /** Optional icon rendered inside the confirm button (Resend reference is text-only) */
  ButtonIcon?: typeof AlertIcon;
};

// TODO: Reactivate circle icon/color is a placeholder (green + person-minus, per the
// "positive action, not warning" note).
export const ACTION_CONFIG: Record<ConfirmActionType, ActionConfig> = {
  suspend: {
    heading: () => 'Suspend Driver?',
    description: (name) =>
      `${name} will be temporarily blocked from signing in. You can reactivate later. Please provide a reason for this action.`,
    buttonLabel: 'Suspend',
    buttonClass: 'bg-action-danger-bg hover:bg-action-danger-hover text-white',
    CircleIcon: AlertIcon,
    circleClass: 'bg-[#FEF4E6]',
    circleIconClass: 'text-action-warning-bg',
    ButtonIcon: UserMinusIcon,
  },
  reactivate: {
    heading: () => 'Reactivate Driver?',
    description: (name) =>
      `${name} will regain access to the fleet dashboard.`,
    buttonLabel: 'Reactivate',
    buttonClass: 'bg-action-success-bg hover:bg-action-success-hover text-white',
    CircleIcon: UserMinusIcon,
    circleClass: 'bg-status-success-bg',
    circleIconClass: 'text-status-success-text',
    ButtonIcon: UserMinusIcon,
  },
  resend: {
    heading: () => 'Resend Invitation?',
    description: () =>
      'Are you sure you want to resend the invitation email? A new invitation will be sent to the driver, allowing them to complete their account setup.',
    buttonLabel: 'Resend Invitation',
    buttonClass: 'bg-action-success-bg hover:bg-action-success-hover text-white',
    CircleIcon: MailIcon,
    circleClass: 'bg-[#F1E7FE]',
    circleIconClass: 'text-chip-violet-text',
  },
  'fleet-suspend': {
    heading: () => 'Suspend This Fleet?',
    description: () => [
      'Are you sure you want to suspend this fleet?',
      'Suspending the fleet will temporarily disable all fleet operations. Assigned Fleet Managers will no longer be able to manage this fleet, and drivers will not be able to start new trips until the fleet is reactivated.',
      'This will also deactivate all drivers and vehicles under this fleet.',
      'This action can be reversed at any time. Please provide a reason for this action.',
    ],
    buttonLabel: 'Suspend Fleet',
    buttonClass: 'bg-action-danger-bg hover:bg-action-danger-hover text-white',
    CircleIcon: AlertIcon,
    circleClass: 'bg-[#FEF4E6]',
    circleIconClass: 'text-action-warning-bg',
    ButtonIcon: UserMinusIcon,
  },
  'fleet-reactivate': {
    heading: () => 'Reactivate This Fleet?',
    description: () => [
      'Are you sure you want to reactivate this fleet?',
      'Reactivating the fleet will restore normal operations. Assigned Fleet Managers will regain access to manage the fleet, and drivers will be able to resume trips and other fleet-related activities.',
    ],
    buttonLabel: 'Reactivate Fleet',
    buttonClass: 'bg-action-success-bg hover:bg-action-success-hover text-white',
    CircleIcon: AlertIcon,
    circleClass: 'bg-[#FEF4E6]',
    circleIconClass: 'text-action-warning-bg',
  },
  reject: {
    heading: () => 'Reject Hazard?',
    description: () =>
      'Are you sure you want to reject this hazard? It will be removed from the active queue and the reporter will be notified.',
    buttonLabel: 'Reject',
    buttonClass: 'bg-action-danger-bg hover:bg-action-danger-hover text-white',
    CircleIcon: AlertIcon,
    circleClass: 'bg-[#FEF4E6]',
    circleIconClass: 'text-action-warning-bg',
    ButtonIcon: XIcon,
  },
  resolve: {
    heading: () => 'Resolve Hazard?',
    description: () =>
      'Are you sure you want to resolve this hazard? It will be marked as resolved and removed from the active queue.',
    buttonLabel: 'Resolve',
    buttonClass: 'bg-action-success-bg hover:bg-action-success-hover text-white',
    CircleIcon: CheckIcon,
    circleClass: 'bg-status-success-bg',
    circleIconClass: 'text-status-success-text',
    ButtonIcon: CheckIcon,
  },
  delete: {
    heading: () => 'Delete Hazard?',
    description: () =>
      'Are you sure you want to delete this hazard? This action is permanent and cannot be undone.',
    buttonLabel: 'Delete',
    buttonClass: 'bg-action-danger-bg hover:bg-action-danger-hover text-white',
    CircleIcon: AlertIcon,
    circleClass: 'bg-[#FEF4E6]',
    circleIconClass: 'text-action-warning-bg',
    ButtonIcon: TrashIcon,
  },
};

type ConfirmActionModalProps = {
  open: boolean;
  action: ConfirmActionType;
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** When provided, renders a reason textarea above the confirm button. */
  reason?: string;
  /** Controlled handler for the reason textarea. */
  onReasonChange?: (value: string) => void;
  /** Minimum character length for the reason (default 3). */
  reasonMinLength?: number;
  /** Placeholder text for the reason textarea. */
  reasonPlaceholder?: string;
  /** Disables the confirm button and shows a loading spinner when true. */
  submitting?: boolean;
};

export function ConfirmActionModal({
  open,
  action,
  userName,
  onConfirm,
  onCancel,
  reason = '',
  onReasonChange,
  reasonMinLength = 3,
  reasonPlaceholder = 'Enter a reason...',
  submitting = false,
}: ConfirmActionModalProps) {
  // Escape mirrors the backdrop click and the Cancel button — this dialog's prop
  // is onCancel, not onClose.
  useModalBehavior({ open, onClose: onCancel });

  if (!open) return null;

  const config = ACTION_CONFIG[action];
  const description = config.description(userName);
  const paragraphs = Array.isArray(description) ? description : [description];
  const requiresReason = Boolean(onReasonChange);
  const reasonValid = reason.trim().length >= reasonMinLength;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={config.heading(userName)}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface-card p-8 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <span className={`flex h-16 w-16 items-center justify-center rounded-full ${config.circleClass}`}>
            <config.CircleIcon className={`h-8 w-8 ${config.circleIconClass}`} />
          </span>
          <h2 className="mt-5 text-xl font-bold text-ink-primary">{config.heading(userName)}</h2>
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={`${index === 0 ? 'mt-2' : 'mt-4'} max-w-xs text-sm leading-relaxed text-ink-secondary`}
            >
              {paragraph}
            </p>
          ))}

          {requiresReason && (
            <textarea
              value={reason}
              onChange={(e) => onReasonChange!(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
              className="mt-4 w-full resize-none rounded-xl border border-[#D1D5DB] px-3 py-2 text-sm text-ink-primary placeholder:text-ink-placeholder focus:border-[#2E90FA] focus:outline-none focus:ring-1 focus:ring-[#2E90FA]"
            />
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting || (requiresReason && !reasonValid)}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors ${config.buttonClass} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {submitting ? 'Working…' : config.buttonLabel}
            {!submitting && config.ButtonIcon && (
              <config.ButtonIcon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="mt-3 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}