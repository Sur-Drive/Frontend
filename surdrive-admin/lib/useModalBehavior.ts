'use client';

import { useEffect } from 'react';

// ---------------------------------------------------------------------------
// useModalBehavior — the two behaviors every dialog in the app wants, in one
// place: Escape closes, and the page behind stops scrolling.
//
// There is deliberately no shared modal *component* to hang this off: each of
// the six dialogs and the SOS map's expand overlay repeats its own
// `fixed inset-0` backdrop markup (same classes, same stopPropagation card,
// same role/aria-modal pair) rather than composing a shell. Extracting that
// shell is a separate, larger change; this hook only removes the need to
// re-implement the behaviors per file.
//
// Two things it has to get right, both learned from the existing dialogs:
//
// 1. It keys off `open`, never off mount. LogoutModal, ConfirmActionModal,
//    DriverDetailsModal and InviteDriverModal stay mounted when closed and
//    merely `return null`, so a mount-keyed lock would hide scroll at page load.
// 2. The scroll container is <main>, not <body>: app/admin/layout.tsx is
//    `h-screen overflow-hidden` with the page scrolling inside
//    `<main className="flex-1 overflow-y-auto">`, and globals.css sets no
//    body height/overflow. Locking `body` would be a silent no-op.
//
// `onClose` must be the modal's *own* close path, not necessarily a prop named
// `onClose`: ConfirmActionModal takes `onCancel`, and InviteDriverModal has to
// clear its form/success state as well.
// ---------------------------------------------------------------------------

export type UseModalBehaviorOptions = {
  /** Visibility, not mount state — see note 1 above. */
  open: boolean;
  /** The dialog's real close path, run on Escape. */
  onClose: () => void;
  /** Escape only; pass false where locking scroll would achieve nothing. */
  lockScroll?: boolean;
};

/** Scrollable page container the lock targets — see note 2 above. */
const SCROLL_CONTAINER_SELECTOR = 'main';

export function useModalBehavior({
  open,
  onClose,
  lockScroll = true,
}: UseModalBehaviorOptions): void {
  // Only while visible, and the listener goes with the cleanup on close/unmount.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !lockScroll) return;
    const container = document.querySelector<HTMLElement>(SCROLL_CONTAINER_SELECTOR);
    if (!container) return;
    // Capture rather than assume 'auto': restore exactly what was there, in case
    // anything else ever owns this style too.
    const previousOverflow = container.style.overflow;
    container.style.overflow = 'hidden';
    return () => {
      container.style.overflow = previousOverflow;
    };
  }, [open, lockScroll]);
}
