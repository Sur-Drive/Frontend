'use client';

import { useEffect, useRef, useState } from 'react';
import { EyeIcon } from '@/components/ui/icons/EyeIcon';
import { EditIcon } from '@/components/ui/icons/EditIcon';
import { XCircleIcon } from '@/components/ui/icons/XCircleIcon';
import { MoreIcon } from '@/components/ui/icons/MoreIcon';

// TODO: all actions are stubs — wire to real subscription API calls.
// NOTE: the menu shows the same three options (View details / Extend / Cancel)
// regardless of subscription status.
type SubscriptionActionsMenuProps = {
  userName: string;
  onViewDetails: () => void;
  onExtend: () => void;
  onCancel: () => void;
};

export function SubscriptionActionsMenu({
  userName,
  onViewDetails,
  onExtend,
  onCancel,
}: SubscriptionActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on click-outside
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Actions for ${userName}`}
        aria-expanded={open}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
          open
            ? 'bg-surface-hover text-ink-secondary'
            : 'text-ink-placeholder hover:bg-surface-hover hover:text-ink-secondary'
        }`}
      >
        <MoreIcon className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-8 top-0 z-20 w-44 overflow-hidden rounded-xl border border-line-card bg-surface-card py-1.5 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onViewDetails();
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-ink-secondary transition-colors hover:bg-surface-hover"
          >
            <EyeIcon className="h-4 w-4" />
            View details
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onExtend();
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-brand-primary transition-colors hover:bg-surface-hover"
          >
            <EditIcon className="h-4 w-4" />
            Extend
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onCancel();
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-status-danger-text transition-colors hover:bg-surface-hover"
          >
            <XCircleIcon className="h-4 w-4" />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}