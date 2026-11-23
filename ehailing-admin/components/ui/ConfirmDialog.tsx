"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { createPortal } from "react-dom";
import { TriangleAlert } from "lucide-react";
import { Button } from "./Button";

// The warning icon tile is always amber; only the confirm button turns red when
// tone="danger".
const TILE = "bg-warning-soft";
const TILE_ICON = "text-warning";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  icon?: LucideIcon;
  // "danger" renders the confirm button in the danger solid tone; "default"
  // keeps it brand. The warning icon tile stays amber either way.
  tone?: "default" | "danger";
  // Colour of the confirm button; "danger" renders it in the danger solid tone.
  confirmTone?: "brand" | "danger";
  // When provided, renders an optional internal-note textarea.
  noteLabel?: string;
  // Makes the note textarea mandatory: the confirm button stays disabled until
  // some text is entered, and an alert message explains why.
  noteRequired?: boolean;
  // Placeholder for the note textarea.
  notePlaceholder?: string;
  // When true the note textarea renders disabled (its value is never sent):
  // the control keeps its slot behind a "Not available yet" tooltip with a
  // "Not saved yet" helper line.
  noteDisabled?: boolean;
  // Optional field rendered above the internal-note textarea (e.g. an assignee
  // select for an "Assign officer" confirmation).
  children?: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}

// Reusable confirmation dialog for sensitive actions. Renders through a portal
// above the topbar/sidebar/drawer, with focus trapping, scroll lock and a
// fade + scale-in entrance.
export function ConfirmDialog({
  open,
  title,
  description,
  icon: Icon = TriangleAlert,
  tone = "default",
  confirmTone = "brand",
  noteLabel,
  noteRequired = false,
  notePlaceholder,
  noteDisabled = false,
  children,
  confirmLabel = "Confirm action",
  loading = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [mounted] = useState(() => typeof window !== "undefined");
  const [prevOpen, setPrevOpen] = useState(open);
  const [note, setNote] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const baseId = useId();

  // Reset the note each time the dialog opens (render-time state adjustment).
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setNote("");
  }

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!loading) onCancel();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button, textarea, input, select, a[href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => !el.hasAttribute("disabled"));
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
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, loading, onCancel]);

  if (!open || !mounted) return null;

  const noteTextarea = (
    <textarea
      value={note}
      onChange={(event) => setNote(event.target.value)}
      placeholder={notePlaceholder ?? "Add context for this action..."}
      disabled={noteDisabled}
      aria-required={noteRequired || undefined}
      aria-invalid={noteRequired && !note.trim() ? true : undefined}
      className="mt-2 min-h-26 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
    />
  );

  return createPortal(
    <div
      className="dialog-anim fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm"
      style={{ animationName: "dialog-fade-in" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${baseId}-title`}
        aria-describedby={`${baseId}-desc`}
        className="dialog-anim mx-4 max-h-[calc(100dvh-2rem)] w-full max-w-136 overflow-y-auto rounded-3xl bg-surface p-7 shadow-xl sm:p-8"
        style={{ animationName: "dialog-pop-in" }}
      >
        <span
          aria-hidden="true"
          className={`flex size-14 items-center justify-center rounded-2xl ${TILE}`}
        >
          <Icon className={`size-6 ${TILE_ICON}`} />
        </span>

        <h2
          id={`${baseId}-title`}
          className="mt-5 text-2xl font-normal text-ink"
        >
          {title}
        </h2>
        <p id={`${baseId}-desc`} className="mt-2 text-sm text-ink-muted">
          {description}
        </p>

        {children ? <div className="mt-5">{children}</div> : null}

        {noteLabel ? (
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">{noteLabel}</span>
              <span className="text-sm text-ink-subtle">
                {noteRequired ? "Required" : "Optional"}
              </span>
            </div>
            {noteDisabled ? (
              <span title="Not available yet" className="block">
                {noteTextarea}
              </span>
            ) : (
              noteTextarea
            )}
            {noteDisabled ? (
              <p className="mt-1 text-xs text-ink-muted">Not saved yet</p>
            ) : null}
            {noteRequired && !note.trim() ? (
              <p role="alert" className="mt-2 text-xs text-danger">
                A reason is required for this action.
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex gap-3 sm:justify-end">
          <Button
            ref={cancelRef}
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="h-11! flex-1 px-6! sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(note)}
            variant={confirmTone === "danger" || tone === "danger" ? "danger" : "primary"}
            loading={loading}
            disabled={noteRequired && !note.trim()}
            className="h-11! flex-1 px-6! sm:flex-none"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
