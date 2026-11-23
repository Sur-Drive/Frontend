"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface SideSheetProps {
  open: boolean;
  onClose: () => void;
  eyebrow: string;
  title: string;
  subtitle?: string;
  // Rendered under the header (used for the ride details tabs).
  headerExtras?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  closeOnEscape?: boolean;
  trapFocus?: boolean;
}

const FOCUSABLE =
  'button:not([disabled]), textarea, input, select, a[href], [tabindex]:not([tabindex="-1"])';

// Right-hand side sheet rendered through a portal above the topbar/sidebar/
// mobile drawer but below ConfirmDialog. Callers stacked on top of it pass
// closeOnEscape={false} trapFocus={false} so only the top layer reacts.
export function SideSheet({
  open,
  onClose,
  eyebrow,
  title,
  subtitle,
  headerExtras,
  footer,
  children,
  closeOnEscape = true,
  trapFocus = true,
}: SideSheetProps) {
  const [mounted] = useState(() => typeof window !== "undefined");
  const panelRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  // Scroll lock and focus return run only on open/close, so a caller toggling
  // closeOnEscape/trapFocus (while a dialog is stacked on top) never steals
  // focus back from that dialog.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  // Keyboard handling is registered separately so it always reads the latest
  // closeOnEscape/trapFocus values without re-running the focus effect.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (closeOnEscape) onClose();
        return;
      }
      if (event.key !== "Tab" || !trapFocus) return;
      const nodes = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, closeOnEscape, trapFocus, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="sheet-anim absolute inset-0 bg-ink/40 backdrop-blur-sm"
        style={{ animationName: "sheet-fade-in" }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${baseId}-title`}
        aria-describedby={subtitle ? `${baseId}-subtitle` : undefined}
        tabIndex={-1}
        className="sheet-anim absolute inset-y-0 right-0 flex h-full w-full flex-col bg-surface shadow-xl outline-none sm:max-w-2xl"
        style={{ animationName: "sheet-slide-in" }}
      >
        <header className="shrink-0 border-b border-border px-5 pb-4 pt-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                {eyebrow}
              </p>
              <h2
                id={`${baseId}-title`}
                className="mt-1.5 text-3xl font-normal text-ink"
              >
                {title}
              </h2>
              {subtitle ? (
                <p
                  id={`${baseId}-subtitle`}
                  className="mt-1 text-sm text-ink-muted"
                >
                  {subtitle}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          {headerExtras ? <div className="mt-4">{headerExtras}</div> : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {children}
        </div>

        {footer ? (
          <footer className="shrink-0 border-t border-border px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {footer}
            </div>
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
