"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, CircleX, Info, TriangleAlert, X } from "lucide-react";
import {
  dismissToast,
  getToasts,
  subscribe,
  toast as toastApi,
} from "@/lib/toast-store";
import type { ToastData, ToastVariant } from "@/lib/toast-store";

// Auto-dismiss window in ms; errors linger longer so they aren't missed.
const DURATION: Record<ToastVariant, number> = {
  success: 4000,
  info: 4000,
  warning: 4000,
  error: 6000,
};

const VARIANT: Record<
  ToastVariant,
  { tile: string; icon: typeof Check; label: string }
> = {
  success: { tile: "bg-success-soft text-success", icon: Check, label: "Success" },
  error: { tile: "bg-danger-soft text-danger", icon: CircleX, label: "Error" },
  warning: {
    tile: "bg-warning-soft text-warning",
    icon: TriangleAlert,
    label: "Warning",
  },
  info: { tile: "bg-info-soft text-info", icon: Info, label: "Information" },
};

// Stable imperative handle; identical to importing `toast` directly.
export function useToast() {
  return toastApi;
}

const emptySubscribe = () => () => {};

// Mount once, high in the tree (root layout) so toasts survive navigation.
export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToastViewport />
    </>
  );
}

function ToastViewport() {
  const toasts = useSyncExternalStore(subscribe, getToasts, getToasts);
  // Render the portal only after hydration. useSyncExternalStore returns the
  // server snapshot (false) during hydration so SSR and the first client render
  // match, then flips to true — no hydration mismatch, no setState-in-effect.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  if (!mounted) return null;

  return createPortal(
    <div
      // Full-width bottom on mobile (clear of the safe area), bottom-right
      // stack on sm+. Pointer events stay off the gutter, on for each toast.
      className="pointer-events-none fixed inset-x-0 bottom-0 z-100 flex flex-col gap-3 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-0 sm:items-end sm:px-6 sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
    >
      {toasts.map((toast) => (
        <ToastRow key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body,
  );
}

function ToastRow({ toast }: { toast: ToastData }) {
  const variant = VARIANT[toast.variant];
  const Icon = variant.icon;
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(DURATION[toast.variant]);

  // Countdown that pauses on hover/focus and resumes with the time left.
  useEffect(() => {
    if (paused) return;
    const startedAt = Date.now();
    const handle = setTimeout(() => dismissToast(toast.id), remainingRef.current);
    return () => {
      clearTimeout(handle);
      remainingRef.current = Math.max(
        0,
        remainingRef.current - (Date.now() - startedAt),
      );
    };
  }, [paused, toast.id]);

  return (
    <div
      // role="status" is polite; role="alert" is assertive for errors.
      role={toast.variant === "error" ? "alert" : "status"}
      aria-live={toast.variant === "error" ? "assertive" : "polite"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="toast-anim pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-lg sm:w-96"
    >
      <span
        aria-hidden="true"
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${variant.tile}`}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-sm text-ink-muted">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        aria-label={`Dismiss ${variant.label} notification`}
        className="-mr-1 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
