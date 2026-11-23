'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@/components/ui/icons/ChevronLeftIcon';
import { EditIcon } from '@/components/ui/icons/EditIcon';
import { XCircleIcon } from '@/components/ui/icons/XCircleIcon';
import { DownloadIcon } from '@/components/ui/icons/DownloadIcon';
import { Toast } from '@/components/ui/Toast';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ExtendSubscriptionModal } from './ExtendSubscriptionModal';
import { CancelSubscriptionModal } from './CancelSubscriptionModal';
import { getSubscriptionById } from '@/lib/subscriptions';
import { formatNaira } from '@/lib/formatters';
import type { Subscription, SubscriptionInvoice } from '@/types';

const PLAN_LABEL: Record<string, string> = {
  pro: 'Pro Fleet',
  starter: 'Starter Fleet',
  free_trial: 'Free Trial',
  enterprise: 'Enterprise',
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  active: 'bg-status-success-bg text-status-success-text',
  trial: 'bg-[#EEF2FF] text-[#6172F3]',
  expired: 'bg-status-danger-bg text-status-danger-text',
  pending: 'bg-status-warning-bg text-status-warning-text',
};

const PAYMENT_BADGE_STYLES: Record<string, string> = {
  Paid: 'bg-status-success-bg text-status-success-text',
  Pending: 'bg-status-warning-bg text-status-warning-text',
};

function planLabel(plan: string): string {
  return PLAN_LABEL[plan] ?? plan;
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

type SubscriptionDetailsViewProps = {
  subscriptionId: string;
};
/**
 * Subscription drill-down page content
 * (route: /admin/subscription-management/[subscriptionId]).
 * Fetches the subscription by id via the real API. Extend/Cancel are still
 * local-only TODO stubs (no backend support yet).
 */
export function SubscriptionDetailsView({ subscriptionId }: SubscriptionDetailsViewProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extendOpen, setExtendOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchSubscription() {
      setLoading(true);
      setError(null);
      try {
        const data = await getSubscriptionById(subscriptionId);
        if (!cancelled) setSubscription(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSubscription();
    return () => {
      cancelled = true;
    };
  }, [subscriptionId]);

  const invoices = subscription?.paymentHistory ?? [];

  const handleExtend = () => {
    // TODO: replace with real API call (subscription renewal/extend)
    setExtendOpen(false);
    setToastMessage('Renewal date successfully extended.');
  };

  const handleCancelConfirm = () => {
    if (!subscription) return;
    // TODO: replace with real API call (subscription cancellation)
    setSubscription((prev) => (prev ? { ...prev, isExpired: true, status: 'expired' } : prev));
    setCancelOpen(false);
    setToastMessage('Subscription successfully cancelled.');
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href="/admin/subscription-management"
          className="flex w-fit items-center gap-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Subscription List
        </Link>
        <div className="rounded-2xl border border-line-card bg-surface-card p-12 text-center text-ink-tertiary">
  
          Loading subscription...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href="/admin/subscription-management"
          className="flex w-fit items-center gap-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Subscription List
        </Link>
        <div className="rounded-2xl border border-line-card bg-surface-card p-12 text-center text-status-danger-text">
          {error}
        </div>
      </div>
    );
  }

  if (!subscription) {
    return <SubscriptionNotFound />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <Link
        href="/admin/subscription-management"
        className="flex w-fit items-center gap-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to Subscription List
      </Link>

      {/* Header card */}
      <section className="rounded-2xl border border-line-card bg-surface-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white">
                {subscription.user.initials}
              </span>
              <div>
                <h1 className="text-lg font-bold text-ink-primary">{subscription.user.fullName}</h1>
                <p className="text-sm text-ink-tertiary">{subscription.user.email}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-medium text-ink-secondary">
                {subscription.organization.name}
              </span>
              <span className="inline-flex items-center rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-medium text-[#6172F3]">
                {planLabel(subscription.plan)}
              </span>
              <StatusBadge
                label={statusLabel(subscription.status)}
                className={STATUS_BADGE_STYLES[subscription.status] ?? 'bg-status-neutral-bg text-status-neutral-text'}
              />
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="text-2xl font-bold text-ink-primary">{formatNaira(subscription.amount)}</span>
            <span className="text-sm text-ink-tertiary">Next renewal: {subscription.renewalDate}</span>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExtendOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-line-pill px-4 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-hover"
              >
                <EditIcon className="h-4 w-4" />
                Extend
              </button>
              <button
                type="button"
                onClick={() => setCancelOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-status-danger-bg px-4 py-2.5 text-sm font-medium text-status-danger-text transition-colors hover:bg-status-danger-bg"
              >
                <XCircleIcon className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* Payment History */}
      <section className="rounded-2xl border border-line-card bg-surface-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-primary">Payment History</h2>
          <span className="text-sm text-ink-tertiary">
            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-line-pill p-8 text-center text-sm text-ink-tertiary">
            No payment history available for this subscription.
          </div>
        ) : (
          <div className="mt-5 hidden overflow-x-auto rounded-xl border border-line-card lg:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-line-card bg-surface-subtle text-xs font-medium uppercase tracking-wide text-ink-tertiary">
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3" aria-label="Download" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <InvoiceRow key={invoice.invoiceNumber} invoice={invoice} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile: stacked invoice cards (display-only, per-card download) */}
        {invoices.length > 0 && (
          <ul className="mt-5 flex flex-col gap-3 lg:hidden">
            {invoices.map((invoice) => (
              <InvoiceCard key={invoice.invoiceNumber} invoice={invoice} />
            ))}
          </ul>
        )}
      </section>

      {extendOpen && (
        <ExtendSubscriptionModal
          subscription={subscription}
          onClose={() => setExtendOpen(false)}
          onConfirm={handleExtend}
        />
      )}

      {cancelOpen && (
        <CancelSubscriptionModal
          subscription={subscription}
          onClose={() => setCancelOpen(false)}
          onConfirm={handleCancelConfirm}
        />
      )}

      {toastMessage && (
        <Toast open={!!toastMessage} message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}
function InvoiceRow({ invoice }: { invoice: SubscriptionInvoice }) {
  return (
    <tr className="border-b border-line-divider last:border-b-0">
      <td className="px-4 py-3.5 font-medium text-ink-primary">{invoice.invoiceNumber}</td>
      <td className="px-4 py-3.5">
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-ink-primary">{planLabel(invoice.plan) || ' '}</span>
          <span className="truncate text-xs text-ink-placeholder">
            {formatNaira(invoice.pricePerVehicle)}/per vehicle month
          </span>
        </span>
      </td>
      <td className="px-4 py-3.5 text-ink-secondary">{formatNaira(invoice.amount)}</td>
      <td className="px-4 py-3.5 text-ink-secondary">{invoice.date}</td>
      <td className="px-4 py-3.5">
        <StatusBadge
          label={invoice.status}
          className={PAYMENT_BADGE_STYLES[invoice.status] ?? 'bg-status-neutral-bg text-status-neutral-text'}
        />
      </td>
      <td className="px-4 py-3.5 text-ink-secondary">{invoice.paymentReference ?? '—'}</td>
      <td className="px-4 py-3.5">
        {/* TODO: wire to real invoice download */}
        <button
          type="button"
          aria-label={`Download ${invoice.invoiceNumber}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-placeholder transition-colors hover:bg-surface-hover hover:text-ink-secondary"
        >
          <DownloadIcon className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

function InvoiceCard({ invoice }: { invoice: SubscriptionInvoice }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-line-card bg-surface-card p-4">
      {/* Header: invoice number + date + status */}
      <div className="flex items-center gap-3">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-ink-primary">
            {invoice.invoiceNumber}
          </span>
          <span className="truncate text-xs text-ink-placeholder">{invoice.date}</span>
        </span>
        <StatusBadge
          label={invoice.status}
          className={PAYMENT_BADGE_STYLES[invoice.status] ?? 'bg-status-neutral-bg text-status-neutral-text'}
        />
        {/* TODO: wire to real invoice download */}
        <button
          type="button"
          aria-label={`Download ${invoice.invoiceNumber}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-placeholder transition-colors hover:bg-surface-hover hover:text-ink-secondary"
        >
          <DownloadIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Key metric */}
      <div className="flex items-center gap-2 border-t border-line-divider pt-3">
        <span className="text-xs text-ink-tertiary">Amount</span>
        <span className="ml-auto text-sm font-semibold text-ink-primary">
          {formatNaira(invoice.amount)}
        </span>
      </div>
    </li>
  );
}

function SubscriptionNotFound() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/subscription-management"
        className="flex w-fit items-center gap-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to Subscription List
      </Link>
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-line-card bg-surface-card p-16">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-status-danger-bg">
          <XCircleIcon className="h-7 w-7 text-status-danger-text" />
        </span>
        <h2 className="text-lg font-bold text-ink-primary">Subscription not found</h2>
        <p className="max-w-sm text-center text-sm text-ink-tertiary">
          The subscription you are looking for does not exist or may have been removed.
        </p>
        <Link
          href="/admin/subscription-management"
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-hover"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to all subscriptions
        </Link>
      </div>
    </div>
  );
}
