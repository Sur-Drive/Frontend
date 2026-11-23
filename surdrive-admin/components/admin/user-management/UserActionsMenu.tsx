'use client';

import { useEffect, useRef, useState } from 'react';
import { EyeIcon } from '@/components/ui/icons/EyeIcon';
import { UserMinusIcon } from '@/components/ui/icons/UserMinusIcon';
import { SendIcon } from '@/components/ui/icons/SendIcon';
import { MoreIcon } from '@/components/ui/icons/MoreIcon';
import type { DriverStatus } from '@/types';

type SecondaryAction = {
  label: string;
  Icon: typeof EyeIcon;
  className: string;
};

// TODO: all actions are stubs — wire to real status-update API calls
const SECONDARY_ACTION: Record<DriverStatus, SecondaryAction> = {
  active: {
    label: 'Suspend',
    Icon: UserMinusIcon,
    className: 'text-action-warning-bg',
  },
  suspended: {
    label: 'Reactivate',
    Icon: UserMinusIcon,
    className: 'text-status-success-text',
  },
  pending: {
    label: 'Resend Invite',
    Icon: SendIcon,
    className: 'text-brand-accent',
  },
  inactive: {
    label: 'Reactivate',
    Icon: UserMinusIcon,
    className: 'text-status-success-text',
  },
};

type UserActionsMenuProps = {
  userName: string;
  status: DriverStatus;
  onViewDetails: () => void;
  onSuspend?: () => void;
  onReactivate?: () => void;
};

export function UserActionsMenu({ userName, status, onViewDetails, onSuspend, onReactivate }: UserActionsMenuProps) {
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

  const secondary = SECONDARY_ACTION[status];
  const { Icon: SecondaryIcon } = secondary;

  const handleSecondary = () => {
    setOpen(false);
    if (secondary.label === 'Suspend' && onSuspend) {
      onSuspend();
    } else if (secondary.label === 'Reactivate' && onReactivate) {
      onReactivate();
    }
  };

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
          {/* TODO: wire view-details to a user detail page/modal */}
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
            onClick={handleSecondary}
            className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-sm transition-colors hover:bg-surface-hover ${secondary.className}`}
          >
            <SecondaryIcon className="h-4 w-4" />
            {secondary.label}
          </button>
        </div>
      )}
    </div>
  );
}