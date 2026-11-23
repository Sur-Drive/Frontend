'use client';

import Image from 'next/image';
import { XIcon } from '@/components/ui/icons/XIcon';
import { logout } from '@/lib/auth';
import { useModalBehavior } from '@/lib/useModalBehavior';

type LogoutModalProps = {
  open: boolean;
  onClose: () => void;
};

export function LogoutModal({ open, onClose }: LogoutModalProps) {
  // Escape closes through the same path as the backdrop and the Cancel button.
  useModalBehavior({ open, onClose });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Confirm log out"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-surface-card p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-ink-tertiary transition-colors hover:text-ink-primary"
        >
          <XIcon className="h-[18px] w-[18px]" />
        </button>

        <div className="flex flex-col items-center pt-4 text-center">
          <Image
            src="/images/logout-confirm.png"
            alt=""
            width={112}
            height={112}
            className="h-28 w-28 object-contain"
            aria-hidden="true"
          />

          <h2 className="mt-6 text-lg font-bold text-ink-primary">
            Are you sure you want to log out?
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-tertiary">
            Logging out will end your session, and you will need to sign in again to continue
          </p>

          <div className="mt-6 flex w-full items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-line-pill bg-surface-card px-6 py-2.5 text-sm font-medium text-ink-primary transition-colors hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                window.location.href = '/signin';
              }}
              className="rounded-full bg-action-danger-bg px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-action-danger-hover"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}