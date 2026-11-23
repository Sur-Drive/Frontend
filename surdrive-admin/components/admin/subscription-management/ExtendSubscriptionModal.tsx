'use client';

import { XIcon } from '@/components/ui/icons/XIcon';
import { ArrowRightIcon } from '@/components/ui/icons/ArrowRightIcon';
import { useModalBehavior } from '@/lib/useModalBehavior';
import type { Subscription } from '@/types';

type ExtendSubscriptionModalProps = {
  subscription: Subscription;
  onClose: () => void;
  onConfirm: () => void;
};

/**
 * "Extend Subscription" flow — pick a new fleet size / renewal term.
 * TODO: wire the Continue action to the real extend/renewal API.
 * The input shows the next renewal date with a violet day-count badge ("31"),
 * under a "New Fleet Size" label — the mismatch is retained from the original copy.
 */
export function ExtendSubscriptionModal({
  subscription,
  onClose,
  onConfirm,
}: ExtendSubscriptionModalProps) {
  // No `open` prop on this one — the parent renders it only while it is wanted.
  useModalBehavior({ open: true, onClose });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Extend Subscription"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-ink-primary">Extend Subscription</h2>
            <p className="mt-1 text-sm text-ink-tertiary">
              Enter the number of vehicles you want to register under your fleet.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-placeholder transition-colors hover:bg-surface-hover hover:text-ink-primary"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Current renewal date — read-only */}
        <div className="mt-6 flex items-center justify-between rounded-xl bg-surface-hover px-4 py-3">
          <span className="text-sm text-ink-secondary">Current Renewal Date</span>
          <span className="text-sm font-semibold text-ink-primary">{subscription.renewalDate}</span>
        </div>

        {/* New fleet size / next renewal */}
        <div className="mt-5">
          <label
            htmlFor="new-fleet-size"
            className="mb-1.5 block text-sm font-medium text-ink-primary"
          >
            New Fleet Size
          </label>
          <div className="flex items-center justify-between rounded-xl border border-line-pill px-4 py-2.5">
            <input
              id="new-fleet-size"
              type="text"
              readOnly
              value={subscription.renewalDate}
              className="w-full bg-transparent text-sm text-ink-primary outline-none"
            />
            <span className="ml-2 flex h-6 shrink-0 items-center rounded-md bg-brand-primary px-2 text-xs font-semibold text-white">
              31
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line-pill px-6 py-2.5 text-sm font-semibold text-ink-secondary transition-colors hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-hover"
          >
            Continue
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}