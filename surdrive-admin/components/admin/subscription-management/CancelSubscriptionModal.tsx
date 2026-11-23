'use client';

import { AlertIcon } from '@/components/ui/icons/AlertIcon';
import { useModalBehavior } from '@/lib/useModalBehavior';
import type { Subscription } from '@/types';

type CancelSubscriptionModalProps = {
  subscription: Subscription;
  onClose: () => void;
  onConfirm: () => void;
};

/**
 * "Cancel This Subscription?" confirmation with a 2x2 summary of the affected
 * subscription. Built as a dedicated modal (rather than extending the shared
 * ConfirmActionModal) because the info grid layout is unique to this flow.
 * TODO: wire the confirm action to the real cancellation API.
 */

const PLAN_LABEL: Record<string, string> = {
  pro: 'Pro Fleet',
  starter: 'Starter Fleet',
  free_trial: 'Free Trial',
  enterprise: 'Enterprise',
};

function planLabel(plan: string): string {
  return PLAN_LABEL[plan] ?? plan;
}

export function CancelSubscriptionModal({
  subscription,
  onClose,
  onConfirm,
}: CancelSubscriptionModalProps) {
  // No `open` prop on this one — the parent renders it only while the
  // confirmation is wanted, so being mounted is being open.
  useModalBehavior({ open: true, onClose });

  const info = [
    { label: 'Organization', value: subscription.organization.name },
    { label: 'Plan', value: planLabel(subscription.plan) },
    { label: 'Vehicle Capacity', value: String(subscription.vehicleCount) },
    { label: 'Next Renewal', value: subscription.renewalDate },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Cancel This Subscription?"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface-card p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF4E6]">
            <AlertIcon className="h-8 w-8 text-[#F5A623]" />
          </span>
          <h2 className="mt-5 text-xl font-bold text-ink-primary">Cancel This Subscription?</h2>
          <p className="mt-2 text-sm text-ink-secondary">
            Are you sure you want to cancel this subscription?
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-secondary">
            The organization will continue to have access to its current plan until the end of the
            billing period. After cancellation, the subscription will not renew automatically.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl bg-surface-hover p-4">
          {info.map((item) => (
            <div key={item.label}>
              <p className="text-xs text-ink-tertiary">{item.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-ink-primary">{item.value}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="mt-6 w-full rounded-xl bg-action-danger-bg py-3 text-sm font-semibold text-white transition-colors hover:bg-action-danger-hover"
        >
          Cancel Subscription
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-center text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary"
        >
          Keep Subscription
        </button>
      </div>
    </div>
  );
}