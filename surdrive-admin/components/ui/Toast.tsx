'use client';

import { useEffect } from 'react';
import { XIcon } from '@/components/ui/icons/XIcon';
import { CheckIcon } from '@/components/ui/icons/CheckIcon';

type ToastVariant = 'success' | 'error';

const VARIANT_STYLES: Record<
  ToastVariant,
  { iconWrap: string; Icon: typeof CheckIcon }
> = {
  success: { iconWrap: 'bg-status-success-bg text-status-success-text', Icon: CheckIcon },
  error: { iconWrap: 'bg-status-danger-bg text-status-danger-text', Icon: XIcon },
};

type ToastProps = {
  open: boolean;
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
  /** Auto-dismiss delay in ms */
  duration?: number;
};

export function Toast({ open, message, variant = 'success', onClose, duration = 3500 }: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, message, duration, onClose]);

  if (!open) return null;

  const { iconWrap, Icon } = VARIANT_STYLES[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-6 top-6 z-[60] flex items-center gap-3 rounded-xl border border-line-card bg-surface-card py-3 pl-3 pr-4 shadow-lg"
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${iconWrap}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-sm font-medium text-ink-primary">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-ink-placeholder transition-colors hover:bg-surface-hover hover:text-ink-primary"
      >
        <XIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}